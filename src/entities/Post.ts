import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import postFrag from '../shaders/post.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';

export interface PostOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Post {
  public entity: Entity;

  public constructor( options: PostOptions ) {
    this.entity = new Entity();
    this.entity.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      postFrag,
    );
    material.addUniformTexture( 'sampler0', options.input.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/post.frag', () => {
          material.replaceShader( quadVert, postFrag );
        } );
      }
    }

    this.entity.components.push( new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'Post/quad',
    } ) );
  }
}
