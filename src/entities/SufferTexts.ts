import { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';
import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { auto, automaton } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTextureStatic } from '../globals/randomTexture';
import { tinyCharTexture } from '../globals/tinyCharTexture';
import quadVert from '../shaders/quad.vert';
import sufferTextsComputeFrag from '../shaders/suffer-texts-compute.frag';
import sufferTextsRenderFrag from '../shaders/suffer-texts-render.frag';
import sufferTextsRenderVert from '../shaders/suffer-texts-render.vert';

const PARTICLES = 256;

const sufferList = [
  '#DEFINE DISGRACE 1',
  'WELCOME TO THE MANGLER HELL',
  'DEADLINE HARMS YOUR HEALTH',
  'LIBOPUS IS CHEATING',
  'PUBLIC GET FUCKED()',
  '\'RETRUN\': UNDECLARED IDENTIFIER',
  'NOTICE ME, GARBAGE COLLECTOR',
  'WEBGL HATES YOU',
  '#DEFINE COMPROMISE 1',
  'WHERE IS MY SLEEPING SCHEDULE?',
  'GL.DISABLE(GL.TIMEZONE)',
  'SVG.GETPOINTATLENGTH IS CHEATING',
  'COPY\'N\'PASTE ENGINEER',
  '60FPS OR DIE',
  'EXPECT A TERRIBLE STYLE INCONSISTENCY',
  'END MY SUFFER',
];

export class SufferTexts extends Entity {
  public queue: number[][];
  public particleIndex: number;

  public constructor() {
    super();

    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      sufferTextsComputeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/suffer-texts-compute.frag', () => {
          materialCompute.replaceShader( quadVert, sufferTextsComputeFrag );
        } );
      }
    }

    // -- geometry render --------------------------------------------------------------------------
    const geometryRender = new InstancedGeometry();

    const bufferP = glCat.createBuffer();
    bufferP.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    geometryRender.vao.bindVertexbuffer( bufferP, 0, 2 );

    const bufferComputeX = glCat.createBuffer();
    bufferComputeX.setVertexbuffer( ( () => {
      const ret = new Float32Array( PARTICLES );
      for ( let ix = 0; ix < PARTICLES; ix ++ ) {
        const s = ( ix + 0.5 ) / PARTICLES;
        ret[ ix ] = s;
      }
      return ret;
    } )() );

    geometryRender.vao.bindVertexbuffer( bufferComputeX, 1, 1, 1 );

    geometryRender.count = 4;
    geometryRender.mode = gl.TRIANGLE_STRIP;
    geometryRender.primcount = PARTICLES;

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      sufferTextsRenderVert,
      sufferTextsRenderFrag,
      {
        initOptions: { geometry: geometryRender, target: dummyRenderTarget },
      },
    );
    forward.blend = [ gl.ONE, gl.ONE ];

    const materialsRender = { forward };

    forward.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    forward.addUniformTexture( 'samplerTinyChar', tinyCharTexture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/suffer-texts-render.vert',
            '../shaders/suffer-texts-render.frag',
          ],
          () => {
            forward.replaceShader( sufferTextsRenderVert, sufferTextsRenderFrag );
          }
        );
      }
    }

    // -- logic ------------------------------------------------------------------------------------
    this.queue = [];

    this.particleIndex = 0;

    auto( 'sufferText/push', ( { value } ) => {
      const suffer = sufferList[ Math.floor( value ) ].split( '\n' );
      suffer.forEach( ( line, iLine ) => {
        const chars = [ ...line ];
        this.queue.push( ...chars.map( ( char, iChar ) => [
          iChar - 0.5 * ( chars.length - 1 ),
          iLine - 0.5 * ( suffer.length - 1 ),
          char.charCodeAt( 0 ),
        ] ) );
      } );
    } );

    this.components.push( new Lambda( {
      onUpdate: () => {
        const val = this.queue.shift();
        if ( val != null ) {
          const x = ( this.particleIndex + 0.5 ) / PARTICLES;
          materialCompute.addUniform( 'logInit', '4f', ...val, x );
          this.particleIndex = ( this.particleIndex + 1 ) % PARTICLES;
        } else {
          materialCompute.addUniform( 'logInit', '4f', 0.0, 0.0, 0.0, 0.0 );
        }
      },
      name: process.env.DEV && 'SufferTexts/logic',
    } ) );

    if ( process.env.DEV ) {
      ( automaton as AutomatonWithGUI ).on( 'play', () => {
        this.queue = [];
      } );

      ( automaton as AutomatonWithGUI ).on( 'pause', () => {
        this.queue = [];
      } );

      ( automaton as AutomatonWithGUI ).on( 'seek', () => {
        this.queue = [];
      } );
    }

    // -- gpu particles ----------------------------------------------------------------------------
    const gpuParticles = new GPUParticles( {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth: PARTICLES,
      computeHeight: 1,
      computeNumBuffers: 1,
      brtNamePrefix: process.env.DEV && this.name,
    } );
    gpuParticles.meshRender.depthTest = false;
    gpuParticles.meshRender.depthWrite = false;
    this.children.push( gpuParticles );
  }
}
