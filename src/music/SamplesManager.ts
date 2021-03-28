import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Music } from './Music';
import { audio } from '../globals/music';
import { gl, glCat } from '../globals/canvas';
import samplesOpus from './samples.opus';

export class SamplesManager {
  public __music: Music;

  /**
   * it can be undefined since it's loaded asynchronously
   */
  public texture?: GLCatTexture;

  public constructor( music: Music ) {
    this.__music = music;

    // == hot hot hot hot hot ======================================================================
    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [ './samples.opus' ],
          async () => {
            await this.loadSamples();
            music.recompile?.();
          }
        );
      }
    }
  }

  public async loadSamples(): Promise<void> {
    const inputBuffer = await fetch( samplesOpus ).then( ( res ) => res.arrayBuffer() );
    const audioBuffer = await audio.decodeAudioData( inputBuffer );

    const buffer = new Float32Array( 96000 );

    const data = audioBuffer.getChannelData( 0 );
    for ( let i = 0; i < audioBuffer.length; i ++ ) {
      buffer[ i ] = data[ i ];
    }

    const texture = glCat.createTexture()!;
    texture.setTextureFromArray(
      6000,
      16,
      buffer,
      {
        internalformat: gl.R32F,
        format: gl.RED,
        type: gl.FLOAT,
      }
    );
    texture.textureFilter( gl.LINEAR );

    if ( process.env.DEV && this.texture != null ) {
      this.texture.dispose();
    }

    this.texture = texture;
  }
}
