import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import raymarchObjectVert from '../shaders/raymarch-object.vert';
import raymarcherFrag from '../shaders/raymarcher.frag';
import { Lambda } from '../heck/components/Lambda';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import { auto } from '../globals/automaton';
import { dummyRenderTargetFourDrawBuffers, dummyRenderTargetOneDrawBuffers } from '../globals/dummyRenderTarget';
import { genOctahedron } from '../geometries/genOctahedron';

export class Raymarcher extends Entity {
  public constructor() {
    super();

    this.transform.position = new Vector3( [ 0.0, 0.0, 0.0 ] );
    this.transform.scale = new Vector3( [ 1.0, 1.0, 1.0 ] );

    // -- geometry ---------------------------------------------------------------------------------
    const octahedron = genOctahedron( { radius: 2.0, div: 1 } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( octahedron.position, 0, 3 );
    geometry.vao.bindIndexbuffer( octahedron.index );

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;
    geometry.indexType = octahedron.indexType;

    // -- materials --------------------------------------------------------------------------------
    const materials = {
      deferred: new Material(
        raymarchObjectVert,
        raymarcherFrag,
        {
          defines: { 'DEFERRED': 'true' },
          initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
        },
      ),
      shadow: new Material(
        raymarchObjectVert,
        raymarcherFrag,
        {
          defines: { 'SHADOW': 'true' },
          initOptions: { geometry, target: dummyRenderTargetOneDrawBuffers }
        },
      ),
    };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/raymarcher.frag', () => {
          materials.deferred.replaceShader( raymarchObjectVert, raymarcherFrag );
          materials.shadow.replaceShader( raymarchObjectVert, raymarcherFrag );
        } );
      }
    }

    for ( const material of Object.values( materials ) ) {
      material.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );

      material.addUniformTexture( 'samplerRandom', randomTexture.texture );
      material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    }

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onDraw: ( event ) => {
        for ( const material of Object.values( materials ) ) {
          material.addUniform(
            'cameraNearFar',
            '2f',
            event.camera.near,
            event.camera.far
          );

          material.addUniformVector(
            'inversePVM',
            'Matrix4fv',
            event.projectionMatrix
              .multiply( event.viewMatrix )
              .multiply( this.transform.matrix )
              .inverse!
              .elements
          );

          material.addUniform( 'deformAmp', '1f', auto( 'Music/NEURO_WUB_AMP' ) );
          material.addUniform( 'deformFreq', '1f', auto( 'Music/NEURO_WUB_FREQ' ) + auto( 'Music/NEURO_DETUNE' ) );
          material.addUniform( 'deformTime', '1f', auto( 'Music/NEURO_TIME' ) );
        }
      },
      name: process.env.DEV && 'Raymarcher/updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry: geometry,
      materials: materials,
      name: process.env.DEV && 'Raymarcher/mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );
  }
}
