import { GLCat, GLCatBuffer, GLCatProgram, GLCatTexture, GLCatTransformFeedback } from '@fms-cat/glcat-ts';
import { MUSIC_BPM, MUSIC_BUFFER_LENGTH } from './config';
import { Pool } from './utils/Pool';
import musicVert from './shaders/music.vert';
import { gl, glCat } from './globals/canvas';
import samplesOpus from './samples.opus';
import { randomTextureStatic } from './globals/randomTexture';
import { auto, automaton } from './globals/automaton';
import { Channel } from '@fms-cat/automaton';
import { injectCodeToShader } from './utils/injectCodeToShader';
import { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';

const discardFrag = '#version 300 es\nvoid main(){discard;}';

export class Music {
  public isPlaying: boolean;
  public time: number;
  public deltaTime: number;
  public audio: AudioContext;

  private __program: GLCatProgram;
  private __bufferOff: GLCatBuffer;
  private __bufferTransformFeedbacks: [
    GLCatBuffer,
    GLCatBuffer
  ];
  private __transformFeedback: GLCatTransformFeedback;
  private __prevAudioTime: number;
  private __bufferPool: Pool<AudioBuffer>;
  private __prevBufferSource: AudioBufferSourceNode | null = null;
  private __samples?: GLCatTexture;
  private __automatonChannelList: Channel[];
  private __automatonDefineString: string;
  private __textureAutomaton: GLCatTexture;

  constructor( glCat: GLCat, audio: AudioContext ) {
    this.audio = audio;

    // == yoinked from wavenerd-deck ===============================================================
    const bufferOffArray = new Array( MUSIC_BUFFER_LENGTH )
      .fill( 0 )
      .map( ( _, i ) => i );
    this.__bufferOff = glCat.createBuffer();
    this.__bufferOff.setVertexbuffer( new Float32Array( bufferOffArray ) );

    this.__bufferTransformFeedbacks = [
      glCat.createBuffer(),
      glCat.createBuffer(),
    ];
    this.__transformFeedback = glCat.createTransformFeedback();

    this.__bufferTransformFeedbacks[ 0 ].setVertexbuffer(
      MUSIC_BUFFER_LENGTH * 4,
      gl.DYNAMIC_COPY
    );

    this.__bufferTransformFeedbacks[ 1 ].setVertexbuffer(
      MUSIC_BUFFER_LENGTH * 4,
      gl.DYNAMIC_COPY
    );

    this.__transformFeedback.bindBuffer( 0, this.__bufferTransformFeedbacks[ 0 ] );
    this.__transformFeedback.bindBuffer( 1, this.__bufferTransformFeedbacks[ 1 ] );

    // == automaton? ===============================================================================
    this.__automatonChannelList = [];
    this.__automatonDefineString = '';

    this.__updateAutomatonChannelList();

    this.__textureAutomaton = glCat.createTexture();
    this.__textureAutomaton.textureFilter( gl.NEAREST );

    // == program ==================================================================================
    this.__program = glCat.lazyProgram(
      injectCodeToShader( musicVert, this.__automatonDefineString ),
      discardFrag,
      { transformFeedbackVaryings: [ 'outL', 'outR' ] },
    );

    // == audio ====================================================================================
    this.__prevAudioTime = 0;

    this.__bufferPool = new Pool( [
      audio.createBuffer( 2, MUSIC_BUFFER_LENGTH, audio.sampleRate ),
      audio.createBuffer( 2, MUSIC_BUFFER_LENGTH, audio.sampleRate ),
    ] );

    this.__loadSamples();

    // == I think these are gonna be required ======================================================
    this.isPlaying = false;
    this.time = 0.0;
    this.deltaTime = 0.0;

    // == hot hot hot hot hot ======================================================================
    if ( process.env.DEV && module.hot ) {
      const recompileShader = async () => {
        const program = await glCat.lazyProgramAsync(
          injectCodeToShader( musicVert, this.__automatonDefineString ),
          discardFrag,
          { transformFeedbackVaryings: [ 'outL', 'outR' ] },
        ).catch( ( error: any ) => {
          console.error( error );
          return null;
        } );

        if ( program ) {
          this.__program.dispose( true );
          this.__program = program;
        }
      };

      module.hot.accept(
        [ './shaders/music.vert' ],
        () => {
          recompileShader();
        }
      );

      module.hot.accept(
        [ './automaton.json' ],
        () => {
          this.__updateAutomatonChannelList();
          recompileShader();
        }
      );

      ( automaton as AutomatonWithGUI ).on( 'createChannel', ( { name } ) => {
        if ( name.startsWith( 'Music/' ) ) {
          this.__updateAutomatonChannelList();
          recompileShader();
        }
      } );

      ( automaton as AutomatonWithGUI ).on( 'removeChannel', ( { name } ) => {
        if ( name.startsWith( 'Music/' ) ) {
          this.__updateAutomatonChannelList();
          recompileShader();
        }
      } );
    }
  }

  public update(): void {
    const { audio, isPlaying } = this;

    const genTime = audio.currentTime;

    if ( isPlaying ) {
      this.deltaTime = genTime - this.__prevAudioTime;
      this.time += this.deltaTime;

      const buffer = this.__bufferPool.next();

      if ( this.__program ) {
        this.__updateAutomatonTexture();
        this.__prepareBuffer( buffer );
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

    this.__prevAudioTime = genTime;
  }

  private async __loadSamples(): Promise<void> {
    const inputBuffer = await fetch( samplesOpus ).then( ( res ) => res.arrayBuffer() );
    const audioBuffer = await this.audio.decodeAudioData( inputBuffer );

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

    this.__samples = texture;
  }

  private __updateAutomatonChannelList(): void {
    this.__automatonChannelList = [];
    this.__automatonDefineString = '';

    for ( const [ channelName, channel ] of automaton.mapNameToChannel.entries() ) {
      if ( channelName.startsWith( 'Music/' ) ) {
        const key = channelName.substring( 6 );
        const index = this.__automatonChannelList.length;
        this.__automatonDefineString += `const int AUTO_${key}=${index};`;
        this.__automatonChannelList.push( channel );
      }
    }
  }

  private __updateAutomatonTexture(): void {
    const buffer = new Float32Array( MUSIC_BUFFER_LENGTH * 256 );

    for ( const [ iChannel, channel ] of this.__automatonChannelList.entries() ) {
      for ( let iSample = 0; iSample < MUSIC_BUFFER_LENGTH; iSample ++ ) {
        const t = this.time + iSample / this.audio.sampleRate;
        buffer[ MUSIC_BUFFER_LENGTH * iChannel + iSample ] = channel.getValue( t );
      }
    }

    this.__textureAutomaton.setTextureFromArray(
      MUSIC_BUFFER_LENGTH,
      256,
      buffer,
      {
        internalformat: gl.R32F,
        format: gl.RED,
        type: gl.FLOAT,
      }
    );
  }

  private __prepareBuffer( buffer: AudioBuffer ): void {
    const { time } = this;
    const program = this.__program;

    const beatLength = 60.0 / MUSIC_BPM;
    const barLength = 240.0 / MUSIC_BPM;
    const sixteenBarLength = 3840.0 / MUSIC_BPM;

    program.attribute( 'off', this.__bufferOff, 1 );
    program.uniform1f( 'bpm', MUSIC_BPM );
    program.uniform1f( 'bufferLength', MUSIC_BUFFER_LENGTH );
    program.uniform1f( '_deltaSample', 1.0 / this.audio.sampleRate );
    program.uniform4f(
      'timeLength',
      beatLength,
      barLength,
      sixteenBarLength,
      1E16
    );
    program.uniform4f(
      '_timeHead',
      time % beatLength,
      time % barLength,
      time % sixteenBarLength,
      time
    );

    program.uniformTexture( 'samplerRandom', randomTextureStatic.texture );
    program.uniformTexture( 'samplerAutomaton', this.__textureAutomaton );

    if ( this.__samples ) {
      program.uniformTexture( 'samplerSamples', this.__samples );
    }

    glCat.useProgram( program, () => {
      glCat.bindTransformFeedback( this.__transformFeedback, () => {
        gl.enable( gl.RASTERIZER_DISCARD );
        gl.beginTransformFeedback( gl.POINTS );
        gl.drawArrays( gl.POINTS, 0, MUSIC_BUFFER_LENGTH );
        gl.endTransformFeedback();
        gl.disable( gl.RASTERIZER_DISCARD );
      } );
    } );

    gl.flush();

    [ 0, 1 ].map( ( i ) => {
      glCat.bindVertexBuffer( this.__bufferTransformFeedbacks[ i ], () => {
        gl.getBufferSubData(
          gl.ARRAY_BUFFER,
          0,
          buffer.getChannelData( i ),
          0,
          MUSIC_BUFFER_LENGTH
        );
      } );
    } );
  }
};
