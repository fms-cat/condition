import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Swap } from '@fms-cat/experimental';
import quadVert from '../shaders/quad.vert';
import bloomPreFrag from '../shaders/bloom-pre.frag';
import returnFrag from '../shaders/return.frag';
import bloomBlurFrag from '../shaders/bloom-blur.frag';
import bloomPostFrag from '../shaders/bloom-post.frag';

export interface BloomOptions {
  input: GLCatTexture<WebGL2RenderingContext>;
  target: RenderTarget;
}

export class Bloom {
  public entity: Entity;

  public constructor( options: BloomOptions ) {
    this.entity = new Entity();

    const swap = new Swap(
      new BufferRenderTarget( {
        width: options.target.width,
        height: options.target.height,
        name: process.env.DEV && 'Bloom/swap0',
      } ),
      new BufferRenderTarget( {
        width: options.target.width,
        height: options.target.height,
        name: process.env.DEV && 'Bloom/swap1',
      } ),
    );

    // -- pre ----------------------------------------------------------------------------------------
    const materialBloomPre = new Material(
      quadVert,
      bloomPreFrag
    );
    materialBloomPre.addUniformTexture( 'sampler0', options.input );

    this.entity.components.push( new Quad( {
      target: swap.o,
      material: materialBloomPre,
      range: [ -1.0, -1.0, 0.0, 0.0 ],
      name: process.env.DEV && 'Bloom/quadPre',
    } ) );

    swap.swap();

    // -- dup ----------------------------------------------------------------------------------------
    for ( let i = 0; i < 6; i ++ ) {
      const material = new Material(
        quadVert,
        returnFrag
      );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.entity.components.push( new Quad( {
        target: swap.o,
        material,
        range: i === 0 ? [ -1.0, -1.0, 1.0, 1.0 ] : [ 0.0, 0.0, 1.0, 1.0 ],
        name: process.env.DEV && `Bloom/quadDup${ i }`,
      } ) );

      swap.swap();
    }

    // -- blur ---------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        quadVert,
        bloomBlurFrag
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.entity.components.push( new Quad( {
        target: swap.o,
        material,
        name: process.env.DEV && `Bloom/quadBlur${ i }`,
      } ) );

      swap.swap();
    }

    // -- post ---------------------------------------------------------------------------------------
    const materialBloomPost = new Material(
      quadVert,
      bloomPostFrag
    );
    materialBloomPost.addUniformTexture( 'samplerDry', options.input );
    materialBloomPost.addUniformTexture( 'samplerWet', swap.i.texture );

    this.entity.components.push( new Quad( {
      target: options.target,
      material: materialBloomPost,
      name: process.env.DEV && 'Bloom/quadPost',
    } ) );
  }
}
