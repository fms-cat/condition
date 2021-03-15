import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import quadVert from '../shaders/quad.vert';
import glitchFrag from '../shaders/glitch.frag';
import returnFrag from '../shaders/return.frag';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Blit } from '../heck/components/Blit';
import { auto } from '../globals/automaton';

export interface GlitchOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Glitch {
  public amp = 0.0;

  public entity: Entity;
  public material: Material;

  public constructor( options: GlitchOptions ) {
    this.entity = new Entity();

    const entityBypass = new Entity();
    entityBypass.visible = false;
    this.entity.children.push( entityBypass );

    const entityMain = new Entity();
    entityMain.active = false;
    entityMain.visible = false;
    this.entity.children.push( entityMain );

    // -- bypass -----------------------------------------------------------------------------------
    const materialReturn = new Material(
      quadVert,
      returnFrag,
    );
    materialReturn.addUniformTexture(
      'sampler0',
      options.input.texture,
    );

    entityBypass.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: 'Glitch/blitBypass',
    } ) );

    // -- quad -------------------------------------------------------------------------------------
    this.material = new Material( quadVert, glitchFrag );
    this.material.addUniformTexture( 'sampler0', options.input.texture );

    if ( module.hot ) {
      module.hot.accept( '../shaders/glitch.frag', () => {
        this.material.replaceShader( quadVert, glitchFrag );
      } );
    }

    const quad = new Quad( {
      target: options.target,
      material: this.material,
      name: process.env.DEV && 'Glitch/quad',
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
