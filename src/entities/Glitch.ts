import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import quadVert from '../shaders/quad.vert';
import glitchFrag from '../shaders/glitch.frag';
import { Automaton } from '@fms-cat/automaton';

export interface GlitchOptions {
  input: GLCatTexture<WebGL2RenderingContext>;
  target: RenderTarget;
  automaton: Automaton;
}

export class Glitch {
  public amp = 0.0;

  public entity: Entity;
  public material: Material;

  public constructor( options: GlitchOptions ) {
    this.entity = new Entity();

    // -- quad -------------------------------------------------------------------------------------
    this.material = new Material( quadVert, glitchFrag );
    this.material.addUniformTexture( 'sampler0', options.input );

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
    this.entity.components.push( quad );

    // -- update uniform ---------------------------------------------------------------------------
    options.automaton.auto( 'Glitch/amp', ( { value } ) => {
      this.material.addUniform( 'amp', '1f', value );
    } );
  }
}
