import { Channel } from '@fms-cat/automaton';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { MUSIC_AUTOMATON_TEXTURE_HEIGHT } from '../config';
import { Music } from './Music';
import { audio } from '../globals/music';
import { automaton } from '../globals/automaton';
import { gl, glCat } from '../globals/canvas';
import type { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';

/**
 * Inject automaton params into music...
 */
export class AutomatonManager {
  public texture: GLCatTexture;
  public defineString: string;
  private __music: Music;
  private __ChannelList: Channel[];
  private __array: Float32Array;

  public constructor( music: Music ) {
    this.__music = music;

    this.defineString = '';
    this.__ChannelList = [];

    this.__updateAutomatonChannelList();

    this.__array = new Float32Array(
      music.bufferLength * MUSIC_AUTOMATON_TEXTURE_HEIGHT
    );

    this.texture = glCat.createTexture();
    this.texture.textureFilter( gl.NEAREST );

    // == hot hot hot hot hot ======================================================================
    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [ '../automaton.json' ],
          () => {
            this.__updateAutomatonChannelList();
            music.recompile?.();
          }
        );
      }

      ( automaton as AutomatonWithGUI ).on( 'createChannel', ( { name } ) => {
        if ( name.startsWith( 'Music/' ) ) {
          this.__updateAutomatonChannelList();
          music.recompile?.();
        }
      } );

      ( automaton as AutomatonWithGUI ).on( 'removeChannel', ( { name } ) => {
        if ( name.startsWith( 'Music/' ) ) {
          this.__updateAutomatonChannelList();
          music.recompile?.();
        }
      } );
    }
  }

  public update( time: number ): void {
    const bufferLength = this.__music.bufferLength;

    for ( const [ iChannel, channel ] of this.__ChannelList.entries() ) {
      for ( let iSample = 0; iSample < bufferLength; iSample ++ ) {
        const t = time + iSample / audio.sampleRate;
        this.__array[ bufferLength * iChannel + iSample ] = channel.getValue( t );
      }
    }

    this.texture.setTextureFromArray(
      bufferLength,
      MUSIC_AUTOMATON_TEXTURE_HEIGHT,
      this.__array,
      {
        internalformat: gl.R32F,
        format: gl.RED,
        type: gl.FLOAT,
      }
    );
  }

  private __updateAutomatonChannelList(): void {
    this.__ChannelList = [];
    this.defineString = '';

    for ( const [ channelName, channel ] of automaton.mapNameToChannel.entries() ) {
      if ( channelName.startsWith( 'Music/' ) ) {
        const key = channelName.substring( 6 );
        const index = this.__ChannelList.length;
        const y = ( index + 0.5 ) / MUSIC_AUTOMATON_TEXTURE_HEIGHT;
        this.defineString += `const float AUTO_${key}=${y};`;
        this.__ChannelList.push( channel );
      }
    }
  }
}
