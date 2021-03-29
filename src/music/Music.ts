import { AutomatonManager } from './AutomatonManager';
import { GLCatBuffer, GLCatProgram, GLCatTransformFeedback } from '@fms-cat/glcat-ts';
import { MUSIC_BPM } from '../config';
import { SamplesManager } from './SamplesManager';
import { audio } from '../globals/music';
import { binarySearch } from '@fms-cat/automaton';
import { gl, glCat } from '../globals/canvas';
import { injectCodeToShader } from '../utils/injectCodeToShader';
import { randomTextureStatic } from '../globals/randomTexture';
import musicVert from './music.vert';

const discardFrag = '#version 300 es\nvoid main(){discard;}';

const sectionResets = [
  16.0,
  80.0,
  144.0,
  208.0,
  272.0,
  336.0,
  400.0,
  464.0,
  1E9,
].map( ( v ) => v * 60.0 / MUSIC_BPM );

export abstract class Music {
  public isPlaying: boolean;
  public time: number;
  public deltaTime: number;
  public readonly bufferLength: number;

  protected __program: GLCatProgram;
  protected __samplesManager: SamplesManager;
  protected __automatonManager: AutomatonManager;

  private __bufferOff: GLCatBuffer;
  private __bufferTransformFeedbacks: [
    GLCatBuffer,
    GLCatBuffer,
  ];
  private __transformFeedback: GLCatTransformFeedback;
  private __prevAudioTime: number;

  public constructor( bufferLength: number ) {
    this.isPlaying = false;
    this.time = 0.0;
    this.deltaTime = 0.0;
    this.__prevAudioTime = 0.0;
    this.bufferLength = bufferLength;

    // == spicy boys ===============================================================================
    this.__samplesManager = new SamplesManager( this );
    this.__automatonManager = new AutomatonManager( this );

    // == gl =======================================================================================
    const bufferOffArray = new Array( bufferLength )
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
      bufferLength * 4,
      gl.STREAM_READ
    );

    this.__bufferTransformFeedbacks[ 1 ].setVertexbuffer(
      bufferLength * 4,
      gl.STREAM_READ
    );

    this.__transformFeedback.bindBuffer( 0, this.__bufferTransformFeedbacks[ 0 ] );
    this.__transformFeedback.bindBuffer( 1, this.__bufferTransformFeedbacks[ 1 ] );

    this.__program = glCat.lazyProgram(
      injectCodeToShader( musicVert, this.__automatonManager.defineString ),
      discardFrag,
      { transformFeedbackVaryings: [ 'outL', 'outR' ] },
    );

    // == hot hot hot hot hot ======================================================================
    if ( process.env.DEV && module.hot ) {
      module.hot.accept(
        [ './music.vert' ],
        () => {
          this.recompile();
        }
      );
    }
  }

  public async prepare(): Promise<void> {
    await this.__samplesManager.loadSamples();
  }

  public async recompile(): Promise<void> {
    if ( process.env.DEV ) {
      const program = await glCat.lazyProgramAsync(
        injectCodeToShader( musicVert, this.__automatonManager.defineString ),
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
  }

  public update(): void {
    const now = audio.currentTime;

    if ( this.isPlaying ) {
      this.deltaTime = now - this.__prevAudioTime;
      this.time += this.deltaTime;
    } else {
      this.deltaTime = 0.0;
    }

    this.__updateImpl();

    this.__prevAudioTime = now;
  }

  protected abstract __updateImpl(): void;

  protected __render( time: number, callback: ( channel: number ) => void ): void {
    this.__automatonManager.update( time );

    const program = this.__program;

    const beatLength = 60.0 / MUSIC_BPM;
    const barLength = 240.0 / MUSIC_BPM;

    const sectionReset = binarySearch( sectionResets, time );
    const sectionBegin = sectionResets[ sectionReset ];
    const sectionLength = sectionResets[ sectionReset + 1 ] - sectionBegin;

    program.attribute( 'off', this.__bufferOff, 1 );
    program.uniform( 'bpm', '1f', MUSIC_BPM );
    program.uniform( 'bufferLength', '1f', this.bufferLength );
    program.uniform( '_deltaSample', '1f', 1.0 / audio.sampleRate );
    program.uniform(
      'timeLength',
      '4f',
      beatLength,
      barLength,
      sectionLength,
      1E16
    );
    program.uniform(
      '_timeHead',
      '4f',
      time % beatLength,
      time % barLength,
      ( time - sectionBegin ) % sectionLength,
      time,
    );

    program.uniformTexture( 'samplerRandom', randomTextureStatic.texture );
    program.uniformTexture( 'samplerAutomaton', this.__automatonManager.texture );

    if ( this.__samplesManager.texture ) {
      program.uniformTexture( 'samplerSamples', this.__samplesManager.texture );
    }

    glCat.useProgram( program, () => {
      glCat.bindTransformFeedback( this.__transformFeedback, () => {
        gl.enable( gl.RASTERIZER_DISCARD );
        gl.beginTransformFeedback( gl.POINTS );
        gl.drawArrays( gl.POINTS, 0, this.bufferLength );
        gl.endTransformFeedback();
        gl.disable( gl.RASTERIZER_DISCARD );
      } );
    } );

    gl.finish(); // fenceよくわからん

    [ 0, 1 ].map( ( i ) => {
      glCat.bindVertexBuffer(
        this.__bufferTransformFeedbacks[ i ],
        () => callback( i ),
      );
    } );
  }
}
