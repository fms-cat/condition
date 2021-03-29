import { Entity } from '../heck/Entity';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { createSVGTableTexture } from '../utils/createSVGTableTexture';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { objectValuesMap } from '../utils/objectEntriesMap';
import conditionFrag from '../shaders/condition.frag';
import conditionVert from '../shaders/condition.vert';

const POINTS_MAX = 256;

export class Condition extends Entity {
  public constructor() {
    super();
    this.transform.scale = new Vector3( [ 0.05, 0.05, 0.05 ] );

    // -- paths ------------------------------------------------------------------------------------
    const texture = createSVGTableTexture( [
      'M5,5l-9,0l-1,-1l0,-8l1,-1l9,0l0,2l-8,0l0,6l8,0Z',
      'M5,4l0,-8l-1,-1l-8,0l-1,1l0,8l1,1l8,0Z',
      'M3,3l0,-6l-6,0l0,6Z',
      'M5,4l0,-9l-2,0l0,8l-6,0l0,-8l-2,0l0,9l1,1l8,0Z',
      'M5,4l0,-8l-1,-1l-9,0l0,10l9,0Z',
      'M1,5l0,-10l-2,0l0,10Z',
      'M5,5l0,-2l-4,0l0,-8l-2,0l0,8l-4,0l0,2Z',
    ] );

    const tablePos: number[] = [
      0, -40,
      1, -28,
      2, -28,
      3, -16,
      4, -4,
      2, -4,
      5, 4,
      6, 12,
      5, 20,
      1, 28,
      2, 28,
      3, 40,
    ];

    // -- create buffers ---------------------------------------------------------------------------
    const arrayPos = [];
    const arrayInd = [];

    for ( let i = 0; i < POINTS_MAX; i ++ ) {
      const x = i / POINTS_MAX;
      arrayPos.push( x, 0, x, 1, x, 2 );

      for ( let j = 0; j < 3; j ++ ) {
        const j1 = ( j + 1 ) % 3;
        arrayInd.push(
          i * 3 + j,
          i * 3 + 3 + j,
          i * 3 + 3 + j1,
          i * 3 + j,
          i * 3 + 3 + j1,
          i * 3 + j1,
        );
      }
    }

    arrayPos.push( 1, 0, 1, 1, 1, 2 );

    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( arrayPos ) );

    const bufferInd = glCat.createBuffer();
    bufferInd.setIndexbuffer( new Uint16Array( arrayInd ) );

    const arrayIter: number[] = [];

    for ( let i = 0; i < 16; i ++ ) {
      for ( let j = 0; j < 12; j ++ ) {
        arrayIter.push(
          ( tablePos[ j * 2 + 0 ] + 0.5 ) / 7.0,
          tablePos[ j * 2 + 1 ],
          i / 16.0,
          j / 12.0,
        );
      }
    }

    const bufferIter = glCat.createBuffer();
    bufferIter.setVertexbuffer( new Float32Array( arrayIter ) );

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new InstancedGeometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 2 );
    geometry.vao.bindIndexbuffer( bufferInd );
    geometry.vao.bindVertexbuffer( bufferIter, 1, 4, 1 );

    geometry.count = 18 * POINTS_MAX;
    geometry.mode = gl.TRIANGLES;
    geometry.indexType = gl.UNSIGNED_SHORT;
    geometry.primcount = 12 * 16;

    // -- create materials -------------------------------------------------------------------------
    const cubemap = new Material(
      conditionVert,
      conditionFrag,
      {
        defines: [ 'FORWARD 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const deferred = new Material(
      conditionVert,
      conditionFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const materials = { cubemap, deferred };

    objectValuesMap( materials, ( material ) => {
      material.addUniformTexture( 'samplerSvg', texture );

      auto( 'Condition/phaseWidth', ( { value } ) => {
        material.addUniform( 'phaseWidth', '1f', value );
      } );

      auto( 'Sync/first/clap', ( { value } ) => {
        material.addUniform( 'phaseOffset', '1f', value );
      } );

      auto( 'Condition/hahaRatio', ( { value } ) => {
        material.addUniform( 'hahaRatio', '1f', value );
      } );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/condition.vert',
            '../shaders/condition.frag',
          ],
          () => {
            cubemap.replaceShader( conditionVert, conditionFrag );
            deferred.replaceShader( conditionVert, conditionFrag );
          },
        );
      }
    }

    // -- create meshes ----------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'Condition/mesh',
    } );
    this.components.push( mesh );
  }
}
