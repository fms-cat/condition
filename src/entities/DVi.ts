import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import dviFrag from '../shaders/dvi.frag';
import quadVert from '../shaders/quad.vert';
import { auto } from '../globals/automaton';

export interface DViOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class DVi extends Entity {
  public constructor( options: DViOptions ) {
    super();

    // -- bypass -----------------------------------------------------------------------------------
    const blitBypass = new Blit( {
      src: options.input,
      dst: options.target,
      name: 'DVi/blitBypass',
    } );

    // -- dvi --------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      dviFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniformTexture( 'sampler0', options.input.texture );
    material.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/dvi.frag', () => {
          material.replaceShader( quadVert, dviFrag );
        } );
      }
    }

    const quadDVi = new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'DVi/quad',
    } );

    // -- components -------------------------------------------------------------------------------
    this.components.push(
      blitBypass,
      quadDVi,
    );

    // -- bypass auto ------------------------------------------------------------------------------
    auto( 'DVi/active', ( { uninit } ) => {
      quadDVi.active = !uninit;
      blitBypass.active = !quadDVi.active;
    } );
  }
}
