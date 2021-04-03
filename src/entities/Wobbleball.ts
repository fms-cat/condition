import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genOctahedron } from '../geometries/genOctahedron';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import raymarchObjectVert from '../shaders/raymarch-object.vert';
import wobbleballFrag from '../shaders/wobbleball.frag';

export class Wobbleball extends Entity {
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
    const deferred = new Material(
      raymarchObjectVert,
      wobbleballFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      wobbleballFrag,
      {
        defines: [ 'DEPTH 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/wobbleball.frag', () => {
          deferred.replaceShader( raymarchObjectVert, wobbleballFrag );
          depth.replaceShader( raymarchObjectVert, wobbleballFrag );
        } );
      }
    }

    objectValuesMap( materials, ( material ) => {
      material.addUniformTextures( 'samplerRandom', randomTexture.texture );
      material.addUniformTextures( 'samplerRandomStatic', randomTextureStatic.texture );
    } );

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onDraw: ( event ) => {
        objectValuesMap( materials, ( material ) => {
          material.addUniform(
            'cameraNearFar',
            '2f',
            event.camera.near,
            event.camera.far
          );

          material.addUniformMatrixVector(
            'inversePVM',
            'Matrix4fv',
            event.projectionMatrix
              .multiply( event.viewMatrix )
              .multiply( event.globalTransform.matrix )
              .inverse!
              .elements
          );

          material.addUniform( 'deformAmp', '1f', auto( 'Music/NEURO_WUB_AMP' ) );
          material.addUniform( 'deformFreq', '1f', auto( 'Music/NEURO_WUB_FREQ' ) + auto( 'Music/NEURO_DETUNE' ) );
          material.addUniform( 'deformTime', '1f', auto( 'Music/NEURO_TIME' ) );
        } );
      },
      name: process.env.DEV && 'updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );
  }
}
