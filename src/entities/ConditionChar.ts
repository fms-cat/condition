import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import svgVert from '../shaders/svg.vert';
import conditionCharFrag from '../shaders/condition-char.frag';
import { gl, glCat } from '../globals/canvas';
import { Vector3 } from '@fms-cat/experimental';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { auto } from '../globals/automaton';
import { dummyRenderTargetFourDrawBuffers, dummyRenderTargetOneDrawBuffers } from '../globals/dummyRenderTarget';

const POINTS_MAX = 256;

interface SVGTestOptions {
  table: GLCatTexture;
  pos: number;
  i: number;
}

export class ConditionChar extends Entity {
  public constructor( { table, pos, i }: SVGTestOptions ) {
    super();

    this.transform.position = this.transform.position.add( new Vector3( [ 2 * pos, 0, 0 ] ) );

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

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 2 );
    geometry.vao.bindIndexbuffer( bufferInd );

    geometry.count = 18 * POINTS_MAX;
    geometry.mode = gl.TRIANGLES;
    geometry.indexType = gl.UNSIGNED_SHORT;

    // -- create materials -------------------------------------------------------------------------
    const materials = {
      forward: new Material(
        svgVert,
        conditionCharFrag,
        {
          defines: { 'FORWARD': 'true' },
          initOptions: { geometry, target: dummyRenderTargetOneDrawBuffers },
        },
      ),
      deferred: new Material(
        svgVert,
        conditionCharFrag,
        {
          defines: { 'DEFERRED': 'true' },
          initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
        },
      ),
      shadow: new Material(
        svgVert,
        conditionCharFrag,
        {
          defines: { 'SHADOW': 'true' },
          initOptions: { geometry, target: dummyRenderTargetOneDrawBuffers },
        },
      ),
    };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/svg.vert',
            '../shaders/condition-char.frag',
          ],
          () => {
            materials.forward.replaceShader( svgVert, conditionCharFrag );
            materials.deferred.replaceShader( svgVert, conditionCharFrag );
            materials.shadow.replaceShader( svgVert, conditionCharFrag );
          },
        );
      }
    }

    // -- create meshes ----------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && `ConditionChar/mesh${ i }`,
    } );
    this.components.push( mesh );

    // -- material uniforms ------------------------------------------------------------------------
    for ( const material of Object.values( materials ) ) {
      material.addUniform( 'svgi', '1f', i );
      material.addUniformTexture( 'samplerSvg', table );

      auto( 'Condition/phaseOffset', ( { value } ) => {
        material.addUniform( 'phaseOffset', '1f', value );
      } );

      auto( 'Condition/phaseWidth', ( { value } ) => {
        material.addUniform( 'phaseWidth', '1f', value );
      } );
    }
  }
}
