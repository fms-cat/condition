import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import postFrag from '../shaders/post.frag';
import quadVert from '../shaders/quad.vert';

export interface PostOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

const colorPresets = [
  {
    lift: [ -0.07, 0.02, 0.03, 0.01 ],
    gamma: [ 0.0, -0.02, 0.07, 0.02 ],
    gain: [ 1.20, 0.95, 0.92, 1.0 ],
  },
  {
    lift: [ -0.03, 0.01, 0.08, 0.0 ],
    gamma: [ -0.04, 0.02, -0.05, 0.0 ],
    gain: [ 1.04, 0.98, 1.04, 1.0 ],
  },
  {
    lift: [ -0.06, 0.03, 0.1, 0.02 ],
    gamma: [ 0.02, 0.04, 0.04, 0.04 ],
    gain: [ 1.0, 1.0, 1.0, 1.0 ],
  },
];

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
    material.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/post.frag', () => {
          material.replaceShader( quadVert, postFrag );
        } );
      }
    }

    const quad = new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'Post/quad',
    } );
    this.components.push( quad );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Post/colorPreset', ( { value } ) => {
      const preset = colorPresets[ value ];
      material.addUniform( 'colorLift', '4f', ...preset.lift );
      material.addUniform( 'colorGamma', '4f', ...preset.gamma );
      material.addUniform( 'colorGain', '4f', ...preset.gain );
    } );

    auto( 'Post/mixInvert', ( { value } ) => {
      material.addUniform( 'mixInvert', '1f', value );
    } );

    auto( 'Post/mosaicAmp', ( { value } ) => {
      material.addUniform( 'mosaicAmp', '1f', value );
    } );
  }
}
