import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import colorFrag from '../shaders/color.frag';
import objectVert from '../shaders/object.vert';

interface BeamShotOptions {
  length: number;
}

export class BeamShot extends Entity {
  public mesh: Mesh;
  private __forward: Material;

  public constructor( { length }: BeamShotOptions ) {
    super();

    // -- pivot ------------------------------------------------------------------------------------
    const pivot = new Entity();
    pivot.transform.position = new Vector3( [ 0.0, 0.5 * length, 0.0 ] );
    this.children.push( pivot );

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 1.0, 0.5 * length, 1.0 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindVertexbuffer( cube.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    const forward = this.__forward = new Material(
      objectVert,
      colorFrag,
      {
        blend: [ gl.ONE, gl.ONE ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const materials = { forward, cubemap: forward };

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'BeamShot/mesh',
    } );
    pivot.components.push( this.mesh );
  }

  public setWidth( width: number ): void {
    this.mesh.visible = width > 0.0;

    const mul = 0.1 + 0.9 * width;
    this.__forward.addUniform( 'color', '4f', mul * 30.0, mul * 100.0, mul * 1000.0, 1.0 );

    this.transform.scale = new Vector3( [ 0.5 * width, 1.0, 0.5 * width ] );
  }
}
