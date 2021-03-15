import { Component, ComponentDrawEvent, ComponentOptions } from './Component';
import { Geometry } from '../Geometry';
import { Material } from '../Material';
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
  material: Material;
}

export class Mesh extends Component {
  public geometry: Geometry;
  public material: Material;

  public cull: MeshCull = MeshCull.Back;

  public constructor( options: MeshOptions ) {
    super( options );

    this.active = false;

    this.geometry = options.geometry;
    this.material = options.material;
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    const gl = glCat.renderingContext;

    const program = this.material.program;

    glCat.useProgram( program );
    this.material.setBlendMode();

    if ( this.cull === MeshCull.None ) {
      gl.disable( gl.CULL_FACE );
    } else {
      gl.enable( gl.CULL_FACE );
      gl.cullFace( meshCullMap[ this.cull ] );
    }

    this.geometry.assignBuffers( this.material );

    this.material.setUniforms();

    program.uniform1f( 'time', event.time );
    program.uniform1f( 'frameCount', event.frameCount );
    program.uniform2f( 'resolution', event.renderTarget.width, event.renderTarget.height );

    program.uniformMatrix4fv( 'normalMatrix', event.globalTransform.matrix.inverse!.transpose.elements );
    program.uniformMatrix4fv( 'modelMatrix', event.globalTransform.matrix.elements );
    program.uniformMatrix4fv( 'viewMatrix', event.viewMatrix.elements );
    program.uniformMatrix4fv( 'projectionMatrix', event.projectionMatrix.elements );

    this.geometry.draw();
  }
}
