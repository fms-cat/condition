import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import raymarchObjectVert from '../shaders/raymarch-object.vert';
import tetrahedronFrag from '../shaders/tetrahedron.frag';

export class Tetrahedron extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 1.1, 1.1, 1.1 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      raymarchObjectVert,
      tetrahedronFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      tetrahedronFrag,
      {
        defines: [ 'DEPTH 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/tetrahedron.frag', () => {
          deferred.replaceShader( raymarchObjectVert, tetrahedronFrag );
          depth.replaceShader( raymarchObjectVert, tetrahedronFrag );
        } );
      }
    }

    objectValuesMap( materials, ( material ) => {
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
      name: process.env.DEV && 'Tetrahedron/updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'Tetrahedron/mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );

    // -- speen ------------------------------------------------------------------------------------
    const axis = new Vector3( [ 1.0, -1.0, 1.0 ] ).normalized;
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = Quaternion.fromAxisAngle( axis, time );
        objectValuesMap( materials, ( material ) => {
          material.addUniform(
            'distort',
            '1f',
            auto( 'Tetrahedron/distortAmp' )
          );
        } );
      },
      name: process.env.DEV && 'Tetrahedron/update',
    } ) );
  }
}
