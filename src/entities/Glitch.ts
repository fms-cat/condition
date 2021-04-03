import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import glitchFrag from '../shaders/glitch.frag';
import quadVert from '../shaders/quad.vert';

export interface GlitchOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Glitch extends Entity {
  public amp = 0.0;
  public material: Material;

  public constructor( options: GlitchOptions ) {
    super();

    const entityBypass = new Entity();
    entityBypass.visible = false;
    this.children.push( entityBypass );

    const entityMain = new Entity();
    entityMain.active = false;
    entityMain.visible = false;
    this.children.push( entityMain );

    if ( process.env.DEV ) {
      entityBypass.name = 'entityBypass';
      entityMain.name = 'entityMain';
    }

    // -- bypass -----------------------------------------------------------------------------------
    entityBypass.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: process.env.DEV && 'blitBypass',
    } ) );

    // -- quad -------------------------------------------------------------------------------------
    this.material = new Material(
      quadVert,
      glitchFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    this.material.addUniformTexture( 'sampler0', options.input.texture );

    if ( module.hot ) {
      module.hot.accept( '../shaders/glitch.frag', () => {
        this.material.replaceShader( quadVert, glitchFrag );
      } );
    }

    const quad = new Quad( {
      target: options.target,
      material: this.material,
      name: process.env.DEV && 'quad',
    } );
    entityMain.components.push( quad );

    // -- update uniform ---------------------------------------------------------------------------
    auto( 'Glitch/amp', ( { value } ) => {
      this.material.addUniform( 'amp', '1f', value );

      entityMain.active = 0.0 < value;
      entityBypass.active = !entityMain.active;
    } );
  }
}
