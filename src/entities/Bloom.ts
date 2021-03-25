import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Swap } from '@fms-cat/experimental';
import quadVert from '../shaders/quad.vert';
import bloomUpFrag from '../shaders/bloom-up.frag';
import bloomDownFrag from '../shaders/bloom-down.frag';
import { quadGeometry } from '../globals/quadGeometry';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { Blit } from '../heck/components/Blit';

export interface BloomOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Bloom extends Entity {
  public constructor( options: BloomOptions ) {
    super();

    const { width, height } = options.target;

    const swap = new Swap(
      new BufferRenderTarget( {
        width,
        height,
        name: process.env.DEV && 'Bloom/swap0',
      } ),
      new BufferRenderTarget( {
        width,
        height,
        name: process.env.DEV && 'Bloom/swap1',
      } ),
    );

    // -- dry --------------------------------------------------------------------------------------
    this.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: 'Glitch/blitDry',
    } ) );

    // -- down -------------------------------------------------------------------------------------
    for ( let i = 0; i < 6; i ++ ) {
      const isFirst = i === 0;

      const material = new Material(
        quadVert,
        bloomDownFrag,
        { initOptions: { target: dummyRenderTarget, geometry: quadGeometry } },
      );

      material.addUniform( 'level', '1f', i );
      material.addUniformTexture(
        'sampler0',
        isFirst ? options.input.texture : swap.i.texture,
      );

      const p = 2.0 * Math.pow( 0.5, i );
      const range: [ number, number, number, number ] = isFirst
        ? [ -1.0, -1.0, 0.0, 0.0 ]
        : [ 1.0 - p, 1.0 - p, 1.0 - 0.5 * p, 1.0 - 0.5 * p ];

      this.components.push( new Quad( {
        target: swap.o,
        material,
        range,
        name: `Bloom/quadDown${ i }`,
      } ) );

      swap.swap();
    }

    // -- up ---------------------------------------------------------------------------------------
    for ( let i = 5; i >= 0; i -- ) {
      const isLast = i === 0;

      const material = new Material(
        quadVert,
        bloomUpFrag,
        {
          initOptions: { target: dummyRenderTarget, geometry: quadGeometry },
          blend: [ gl.ONE, gl.ONE ],
        },
      );

      material.addUniform( 'level', '1f', i );
      material.addUniformTexture(
        'sampler0',
        swap.i.texture,
      );

      const p = 4.0 * Math.pow( 0.5, i );
      const range: [ number, number, number, number ] = isLast
        ? [ -1.0, -1.0, 1.0, 1.0 ]
        : [ 1.0 - p, 1.0 - p, 1.0 - 0.5 * p, 1.0 - 0.5 * p ];

      this.components.push( new Quad( {
        target: isLast ? options.target : swap.o,
        material,
        range,
        name: `Bloom/quadUp${ i }`,
      } ) );

      swap.swap();
    }
  }
}
