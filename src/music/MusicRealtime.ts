import { Music } from './Music';
import { Pool } from '../utils/Pool';
import { audio } from '../globals/music';
import { gl } from '../globals/canvas';

const BUFFER_LENGTH = 4096;

export class MusicRealtime extends Music {
  private __bufferPool: Pool<AudioBuffer>;
  private __prevBufferSource: AudioBufferSourceNode | null = null;

  public constructor() {
    super( BUFFER_LENGTH );

    this.__bufferPool = new Pool( [
      audio.createBuffer( 2, BUFFER_LENGTH, audio.sampleRate ),
      audio.createBuffer( 2, BUFFER_LENGTH, audio.sampleRate ),
    ] );

    // casually calling async function
    this.__samplesManager.loadSamples();
  }

  public __updateImpl(): void {
    if ( this.isPlaying ) {
      const buffer = this.__bufferPool.next();
      const genTime = audio.currentTime;

      if ( this.__program ) {
        this.__render( this.time, ( i ) => {
          gl.getBufferSubData(
            gl.ARRAY_BUFFER,
            0,
            buffer.getChannelData( i ),
            0,
            BUFFER_LENGTH
          );
        } );
      }

      const bufferSource = audio.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect( audio.destination );

      this.__prevBufferSource?.stop( audio.currentTime );
      bufferSource.start( audio.currentTime, audio.currentTime - genTime );
      this.__prevBufferSource = bufferSource;
    } else {
      this.deltaTime = 0.0;

      this.__prevBufferSource?.stop( audio.currentTime );
      this.__prevBufferSource = null;
    }
  }
}
