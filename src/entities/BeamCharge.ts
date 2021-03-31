import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genOctahedron } from '../geometries/genOctahedron';
import { gl } from '../globals/canvas';
import colorFrag from '../shaders/color.frag';
import objectVert from '../shaders/object.vert';

export class BeamCharge extends Entity {
  public mesh: Mesh;
  private __forward: Material;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const octahedron = genOctahedron( { div: 3 } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( octahedron.position, 0, 3 );
    geometry.vao.bindVertexbuffer( octahedron.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( octahedron.index );

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;
    geometry.indexType = octahedron.indexType;

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
      name: process.env.DEV && 'BeamCharge/mesh',
    } );
    this.components.push( this.mesh );
  }

  public setRadius( radius: number ): void {
    this.mesh.visible = radius > 0.0;

    const mul = 0.1 + 0.9 * radius;
    this.__forward.addUniform( 'color', '4f', mul * 30.0, mul * 100.0, mul * 1000.0, 1.0 );

    this.transform.scale = new Vector3( [ radius, radius, radius ] );
  }
}
