import { GLCat, GLCatBuffer, GLCatProgram, GLCatTexture, GLCatTransformFeedback } from '@fms-cat/glcat-ts';
import { MUSIC_BPM, MUSIC_BUFFER_LENGTH } from './config';
import { Pool } from './utils/Pool';
import musicVert from './shaders/music.vert';
import { gl, glCat } from './globals/canvas';
import samplesOpus from './samples.opus';
import { randomTextureStatic } from './globals/randomTexture';

const discardFrag = '#version 300 es\nvoid main(){discard;}';

export class Music {
  public isPlaying: boolean;
  public time: number;
  public deltaTime: number;
  public audio: AudioContext;
  public samples?: GLCatTexture;

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

    // == program ==================================================================================
    this.__program = glCat.lazyProgram(
      musicVert,
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
    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            './shaders/music.vert',
          ],
          async () => {
            const program = await glCat.lazyProgramAsync(
              musicVert,
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
          }
        );
      }
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

    this.samples = texture;
  }

  private __prepareBuffer( buffer: AudioBuffer ): void {
    const { time } = this;
    const program = this.__program;

    const beatLength = 60.0 / MUSIC_BPM;
    const barLength = 240.0 / MUSIC_BPM;
    const sixteenBarLength = 3840.0 / MUSIC_BPM;

    program.attribute( 'off', this.__bufferOff, 1 );
    program.uniform1f( 'bpm', MUSIC_BPM );
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

    if ( this.samples ) {
      program.uniformTexture( 'samplerSamples', this.samples );
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
