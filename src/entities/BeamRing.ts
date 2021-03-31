import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genTorus } from '../geometries/genTorus';
import { gl } from '../globals/canvas';
import colorFrag from '../shaders/color.frag';
import objectInflateVert from '../shaders/object-inflate.vert';

export class BeamRing extends Entity {
  public mesh: Mesh;
  private __forward: Material;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const torus = genTorus();

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( torus.position, 0, 3 );
    geometry.vao.bindVertexbuffer( torus.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( torus.index );

    geometry.count = torus.count;
    geometry.mode = torus.mode;
    geometry.indexType = torus.indexType;

    // -- materials --------------------------------------------------------------------------------
    const forward = this.__forward = new Material(
      objectInflateVert,
      colorFrag,
      {
        blend: [ gl.ONE, gl.ONE ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    forward.addUniform( 'inflate', '1f', 0.01 );

    const materials = { forward, cubemap: forward };

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'BeamRing/mesh',
    } );
    this.components.push( this.mesh );
  }

  public setRadius( radius: number ): void {
    this.mesh.visible = radius > 0.0;

    const mul = Math.exp( -2.0 * radius );
    this.__forward.addUniform( 'color', '4f', mul * 30.0, mul * 100.0, mul * 1000.0, 1.0 );

    this.__forward.addUniform( 'scale', '3f', radius, radius, radius );
  }
}
