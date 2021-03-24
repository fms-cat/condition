import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Swap } from '@fms-cat/experimental';
import quadVert from '../shaders/quad.vert';
import bloomPreFrag from '../shaders/bloom-pre.frag';
import bloomBlurFrag from '../shaders/bloom-blur.frag';
import bloomPostFrag from '../shaders/bloom-post.frag';
import { quadGeometry } from '../globals/quadGeometry';
import { dummyRenderTargetOneDrawBuffers } from '../globals/dummyRenderTarget';
import { Blit } from '../heck/components/Blit';
import { gl } from '../globals/canvas';

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

    // -- pre ----------------------------------------------------------------------------------------
    const materialBloomPre = new Material(
      quadVert,
      bloomPreFrag,
      { initOptions: { target: dummyRenderTargetOneDrawBuffers, geometry: quadGeometry } },
    );
    materialBloomPre.addUniformTexture( 'sampler0', options.input.texture );

    this.components.push( new Quad( {
      target: swap.o,
      material: materialBloomPre,
      range: [ -1.0, -1.0, 0.0, 0.0 ],
      name: process.env.DEV && 'Bloom/quadPre',
    } ) );

    swap.swap();

    // -- dup ----------------------------------------------------------------------------------------
    for ( let i = 0; i < 6; i ++ ) {
      this.components.push( new Blit( {
        src: swap.i,
        dst: swap.o,
        dstRect: i === 0 ? null : [ width / 2, height / 2, width, height ],
        name: `Bloom/blitDup${ i }`,
        filter: gl.LINEAR,
      } ) );

      swap.swap();
    }

    // -- blur ---------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        quadVert,
        bloomBlurFrag,
        { initOptions: { target: dummyRenderTargetOneDrawBuffers, geometry: quadGeometry } },
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.components.push( new Quad( {
        target: swap.o,
        material,
        name: process.env.DEV && `Bloom/quadBlur${ i }`,
      } ) );

      swap.swap();
    }

    // -- post ---------------------------------------------------------------------------------------
    const materialBloomPost = new Material(
      quadVert,
      bloomPostFrag,
      { initOptions: { target: dummyRenderTargetOneDrawBuffers, geometry: quadGeometry } },
    );
    materialBloomPost.addUniformTexture( 'samplerDry', options.input.texture );
    materialBloomPost.addUniformTexture( 'samplerWet', swap.i.texture );

    this.components.push( new Quad( {
      target: options.target,
      material: materialBloomPost,
      name: process.env.DEV && 'Bloom/quadPost',
    } ) );
  }
}
