import { MUSIC_LENGTH } from '../config';
import { Music } from './Music';
import { audio } from '../globals/music';
import { gl } from '../globals/canvas';

const BUFFER_LENGTH = 16384;

export class MusicOffline extends Music {
  private __buffer: AudioBuffer;
  private __currentBufferSource?: AudioBufferSourceNode | null;

  public constructor() {
    super( BUFFER_LENGTH );

    this.__buffer = audio.createBuffer(
      2,
      MUSIC_LENGTH * audio.sampleRate,
      audio.sampleRate
    );
  }

  public async prepare(): Promise<void> {
    await super.prepare();

    let head = 0;

    return new Promise( ( resolve ) => {
      const render = (): void => {
        const remain = ( MUSIC_LENGTH * audio.sampleRate ) - head;
        if ( remain <= 0 ) {
          resolve();
          return;
        }

        this.__render( head / audio.sampleRate, ( i ) => {
          gl.getBufferSubData(
            gl.ARRAY_BUFFER,
            0,
            this.__buffer.getChannelData( i ),
            head,
            Math.min( remain, BUFFER_LENGTH )
          );
        } );

        head += BUFFER_LENGTH;

        setTimeout( render, 1 );
      };
      render();
    } );
  }

  public __updateImpl(): void {
    if ( this.isPlaying && this.__currentBufferSource == null ) {
      this.__currentBufferSource = audio.createBufferSource();
      this.__currentBufferSource.buffer = this.__buffer;
      this.__currentBufferSource.connect( audio.destination );

      this.__currentBufferSource.start( audio.currentTime, this.time );
    }

    if ( !this.isPlaying && this.__currentBufferSource != null ) {
      this.__currentBufferSource.stop( audio.currentTime );
      this.__currentBufferSource = null;
    }
  }
}
