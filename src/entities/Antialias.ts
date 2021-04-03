import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import fxaaFrag from '../shaders/fxaa.frag';
import quadVert from '../shaders/quad.vert';

export interface PostOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Antialias extends Entity {
  public constructor( options: PostOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      fxaaFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniformTextures( 'sampler0', options.input.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/fxaa.frag', () => {
          material.replaceShader( quadVert, fxaaFrag );
        } );
      }
    }

    this.components.push( new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'quad',
    } ) );
  }
}
