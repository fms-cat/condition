import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import postFrag from '../shaders/post.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';

export interface PostOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Post extends Entity {
  public constructor( options: PostOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      postFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniformTexture( 'sampler0', options.input.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/post.frag', () => {
          material.replaceShader( quadVert, postFrag );
        } );
      }
    }

    this.components.push( new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'Post/quad',
    } ) );
  }
}
