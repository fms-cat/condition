import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import returnFrag from '../shaders/return.frag';
import quadVert from '../shaders/quad.vert';

export interface PostOptions {
  input: GLCatTexture<WebGL2RenderingContext>;
  target: RenderTarget;
}

export class Return {
  public entity: Entity;

  public constructor( options: PostOptions ) {
    this.entity = new Entity();

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      returnFrag,
    );
    material.addUniformTexture( 'sampler0', options.input );

    this.entity.components.push( new Quad( {
      target: options.target,
      material
    } ) );
  }
}
