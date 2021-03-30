import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import crystalFrag from '../shaders/crystal.frag';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

interface CrystalOptions {
  width: number;
  height: number;
  noiseOffset: number;
}

export class Crystal extends Entity {
  public constructor( { width, height, noiseOffset }: CrystalOptions ) {
    super();

    this.transform.position = new Vector3( [ 0.0, 0.0, 0.0 ] );
    this.transform.scale = new Vector3( [ 1.0, 1.0, 1.0 ] );

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ width, height, width ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      raymarchObjectVert,
      crystalFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      crystalFrag,
      {
        defines: [ 'SHADOW 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/crystal.frag', () => {
          deferred.replaceShader( raymarchObjectVert, crystalFrag );
          depth.replaceShader( raymarchObjectVert, crystalFrag );
        } );
      }
    }

    objectValuesMap( materials, ( material ) => {
      material.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );
      material.addUniform( 'size', '2f', width, height );
      material.addUniform( 'noiseOffset', '1f', noiseOffset );

      material.addUniformTexture( 'samplerRandom', randomTexture.texture );
      material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
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
      name: process.env.DEV && 'Crystal/updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'Crystal/mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );
  }
}
