import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import quadVert from '../shaders/quad.vert';
import serialDecodeFrag from '../shaders/serial-decode.frag';
import serialEncodeFrag from '../shaders/serial-encode.frag';

export interface SerialOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Serial extends Entity {
  public constructor( options: SerialOptions ) {
    super();

    const entityBypass = new Entity();
    entityBypass.visible = false;
    this.children.push( entityBypass );

    const entityMain = new Entity();
    entityMain.active = false;
    entityMain.visible = false;
    this.children.push( entityMain );

    // -- bypass -----------------------------------------------------------------------------------
    entityBypass.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: 'Serial/blitBypass',
    } ) );

    // -- encode -----------------------------------------------------------------------------------
    const bufferEncode = new BufferRenderTarget( {
      width: 4096,
      height: 240,
      name: process.env.DEV && 'Serial/bufferEncode',
    } );

    const materialEncode = new Material(
      quadVert,
      serialEncodeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialEncode.addUniformTexture( 'sampler0', options.input.texture );
    materialEncode.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/serial-encode.frag', () => {
          materialEncode.replaceShader( quadVert, serialEncodeFrag );
        } );
      }
    }

    entityMain.components.push( new Quad( {
      target: bufferEncode,
      material: materialEncode,
      name: process.env.DEV && 'Serial/quadEncode',
    } ) );

    // -- decode -----------------------------------------------------------------------------------
    const bufferDecode = new BufferRenderTarget( {
      width: 320,
      height: 240,
      name: process.env.DEV && 'Serial/bufferDecode',
    } );

    const materialDecode = new Material(
      quadVert,
      serialDecodeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialDecode.addUniformTexture( 'sampler0', bufferEncode.texture );
    materialDecode.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/serial-decode.frag', () => {
          materialDecode.replaceShader( quadVert, serialDecodeFrag );
        } );
      }
    }

    entityMain.components.push( new Quad( {
      target: bufferDecode,
      material: materialDecode,
      name: process.env.DEV && 'Serial/quadDecode',
    } ) );

    // -- blit to target -----------------------------------------------------------------------------
    entityMain.components.push( new Blit( {
      src: bufferDecode,
      dst: options.target,
      name: 'Serial/blitTarget',
      filter: gl.LINEAR,
    } ) );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Serial/enable', ( { uninit } ) => {
      entityMain.active = !uninit;
      entityBypass.active = !entityMain.active;
    } );
  }
}
