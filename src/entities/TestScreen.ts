import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import quadVert from '../shaders/quad.vert';
import testScreenFrag from '../shaders/test-screen.frag';

export interface TestScreenOptions {
  target: RenderTarget;
}

export class TestScreen extends Entity {
  public constructor( options: TestScreenOptions ) {
    super();

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      testScreenFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );

    material.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/test-screen.frag', () => {
          material.replaceShader( quadVert, testScreenFrag );
        } );
      }
    }

    const quad = new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'quad',
    } );
    this.components.push( quad );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'TestScreen/circle', ( { value } ) => {
      material.addUniform( 'circle', '1f', value );
    } );

    auto( 'TestScreen/fade', ( { value } ) => {
      material.addUniform( 'fade', '1f', value );
    } );

    auto( 'TestScreen/mode', ( { value } ) => {
      this.active = value > 0.0;
      material.addUniform( 'mode', '1f', value );
    } );
  }
}
