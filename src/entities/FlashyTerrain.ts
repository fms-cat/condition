import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genPlane } from '../geometries/genPlane';
import { quadGeometry } from '../globals/quadGeometry';
import depthFrag from '../shaders/depth.frag';
import flashyTerrainFrag from '../shaders/flashy-terrain.frag';
import flashyTerrainVert from '../shaders/flashy-terrain.vert';

export class FlashyTerrain extends Entity {
  public mesh: Mesh;

  public constructor() {
    super();

    this.transform.position = new Vector3( [ 0.0, -4.0, 0.0 ] );
    this.transform.rotation = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      -0.5 * Math.PI,
    );
    this.transform.scale = this.transform.scale.scale( 8.0 );

    // -- geometry ---------------------------------------------------------------------------------
    const plane = genPlane();

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( plane.position, 0, 3 );
    geometry.vao.bindIndexbuffer( plane.index );

    geometry.count = plane.count;
    geometry.mode = plane.mode;
    geometry.indexType = plane.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      flashyTerrainVert,
      flashyTerrainFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      flashyTerrainVert,
      depthFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/flashy-terrain.vert',
            '../shaders/flashy-terrain.frag',
          ],
          () => {
            deferred.replaceShader( flashyTerrainVert, flashyTerrainFrag );
            depth.replaceShader( flashyTerrainVert, depthFrag );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'FlashyTerrain/mesh',
    } );
    this.components.push( this.mesh );
  }
}
