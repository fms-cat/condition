import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import colorFrag from '../shaders/color.frag';
import objectVert from '../shaders/object.vert';

export class LightCube extends Entity {
  public mesh: Mesh;
  public color = [ 1.0, 1.0, 1.0 ];
  private __forward: Material;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 1.0, 1.0, 1.0 ] } );

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

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: () => {
        this.__forward.addUniform( 'color', '4f', ...this.color, 1.0 );
      },
      name: process.env.DEV && 'updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'LightBar/mesh',
    } );
    this.components.push( this.mesh );
  }
}
