import { MusicOffline } from './MusicOffline';
import toWav from 'audiobuffer-to-wav';

export class MusicWrite extends MusicOffline {
  public async prepare(): Promise<void> {
    await super.prepare();

    const b = toWav( this.__buffer );
    const blob = new Blob( [ b ] );
    const anchor = document.createElement( 'a' );
    anchor.href = URL.createObjectURL( blob );
    anchor.download = 'wenis.wav';
    anchor.click();
  }
}
