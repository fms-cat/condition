import { Component, ComponentDrawEvent, ComponentOptions } from './Component';
import { Geometry } from '../Geometry';
import { MaterialMap, MaterialTag } from '../Material';
import { glCat } from '../../globals/canvas';

export enum MeshCull {
  None,
  Front,
  Back,
  Both
}

const meshCullMap = {
  [ MeshCull.Front ]: /* GL_FRONT */ 1028,
  [ MeshCull.Back ]: /* GL_BACK */ 1029,
  [ MeshCull.Both ]: /* GL_FRONT_AND_BACK */ 1032
};

export interface MeshOptions extends ComponentOptions {
  geometry: Geometry;
  materials: Partial<MaterialMap<MaterialTag>>;
}

export class Mesh extends Component {
  public geometry: Geometry;
  public materials: Partial<MaterialMap<MaterialTag>>;

  public cull: MeshCull = MeshCull.Back;

  public constructor( options: MeshOptions ) {
    super( options );

    this.active = false;

    this.geometry = options.geometry;
    this.materials = options.materials;
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    const gl = glCat.renderingContext;

    const material = this.materials[ event.materialTag ];
    if ( material == null ) {
      return;
    }

    const program = material.program;

    glCat.useProgram( program );
    material.setBlendMode();

    if ( this.cull === MeshCull.None ) {
      gl.disable( gl.CULL_FACE );
    } else {
      gl.enable( gl.CULL_FACE );
      gl.cullFace( meshCullMap[ this.cull ] );
    }

    material.setUniforms();

    program.uniform1f( 'time', event.time );
    program.uniform1f( 'frameCount', event.frameCount );
    program.uniform2f( 'resolution', event.renderTarget.width, event.renderTarget.height );
    program.uniform3f( 'cameraPos', ...event.cameraTransform.position.elements );
    program.uniform2f( 'cameraNearFar', event.camera.near, event.camera.far );

    program.uniformMatrix4fv( 'normalMatrix', event.globalTransform.matrix.inverse!.transpose.elements );
    program.uniformMatrix4fv( 'modelMatrix', event.globalTransform.matrix.elements );
    program.uniformMatrix4fv( 'viewMatrix', event.viewMatrix.elements );
    program.uniformMatrix4fv( 'projectionMatrix', event.projectionMatrix.elements );

    this.geometry.draw();
  }
}
