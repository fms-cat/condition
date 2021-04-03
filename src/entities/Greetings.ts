import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quad } from '../heck/components/Quad';
import { SPRITE_SHEET_SIZE, createFontSpriteSheet } from '../utils/createFontSpriteSheet';
import { Swap, TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { calcCharPos } from '../utils/calcCharPos';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import blurFrag from '../shaders/blur.frag';
import greetingsFrag from '../shaders/greetings.frag';
import greetingsPreBeatmaniaFrag from '../shaders/greetings-pre-beatmania.frag';
import greetingsPreLainFrag from '../shaders/greetings-pre-lain.frag';
import greetingsVert from '../shaders/greetings.vert';
import quadVert from '../shaders/quad.vert';

const INSTANCES = 64;

// -- preprocessor ---------------------------------------------------------------------------------
const materialBlurH = new Material(
  quadVert,
  blurFrag,
  { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
);

const materialBlurV = new Material(
  quadVert,
  blurFrag,
  {
    defines: [ 'IS_VERTICAL 1' ],
    initOptions: { geometry: quadGeometry, target: dummyRenderTarget }
  },
);

const materialPreBeatmania = new Material(
  quadVert,
  greetingsPreBeatmaniaFrag,
  { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
);

const materialPreLain = new Material(
  quadVert,
  greetingsPreLainFrag,
  { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
);

/**
 * Do not add me to its components!
 * It's just for preprocessing
 */
const quadPreprocessor = new Quad( {
  name: process.env.DEV && 'Greetings/quadPreprocessor',
} );

// -- spritesheets ---------------------------------------------------------------------------------
const styles = [
  {
    font: 'Bold 96px Courier New',
    preprocessorMaterials: [ materialPreLain ],
  },
  {
    font: '96px Arial',
    spacing: 1.3,
  },
  {
    font: 'Bold 96px Arial',
    preprocessorMaterials: [
      materialBlurH,
      materialBlurV,
      materialBlurH, // fuck you
      materialBlurV, // fuck you (2)
      materialPreBeatmania,
    ],
  },
  {
    font: '96px Times New Roman',
    scaleY: 1.2,
    spacing: 1.9,
  },
  {
    font: 'Bold 96px Courier New',
    preprocessorMaterials: [ materialPreLain ],
  },
  {
    font: 'Bold 96px Arial',
    scaleY: 1.2,
    spacing: 1.4,
  },
  {
    font: 'Bold 96px Arial',
    preprocessorMaterials: [
      materialBlurH,
      materialBlurV,
      materialBlurH, // fuck you
      materialBlurV, // fuck you (2)
      materialPreBeatmania,
    ],
  },
  {
    font: '96px Times New Roman',
  },
];

const swapIntermediate = new Swap(
  new BufferRenderTarget( {
    width: SPRITE_SHEET_SIZE,
    height: SPRITE_SHEET_SIZE,
    name: process.env.DEV && 'Greetings/intermediate0',
  } ),
  new BufferRenderTarget( {
    width: SPRITE_SHEET_SIZE,
    height: SPRITE_SHEET_SIZE,
    name: process.env.DEV && 'Greetings/intermediate0',
  } ),
);

const spritesheets = styles.map( ( style, iStyle ) => {
  const textureSpriteSheet = createFontSpriteSheet( style );
  let texture: GLCatTexture = textureSpriteSheet;

  ( style.preprocessorMaterials ?? [] ).map( ( material, i ) => {
    material.addUniformTexture(
      'sampler0',
      i === 0 ? textureSpriteSheet : swapIntermediate.o.texture,
    );

    quadPreprocessor.material = material;
    quadPreprocessor.target = swapIntermediate.i;
    quadPreprocessor.drawImmediate();

    swapIntermediate.swap();
    texture = swapIntermediate.o.texture;
  } );

  const dest = new BufferRenderTarget( {
    width: SPRITE_SHEET_SIZE,
    height: SPRITE_SHEET_SIZE,
    name: process.env.DEV && `Greetings/spriteSheet${ iStyle }`,
  } );

  materialBlurH.addUniformTexture( 'sampler0', texture );

  quadPreprocessor.material = materialBlurH;
  quadPreprocessor.target = dest;
  quadPreprocessor.drawImmediate();

  return dest.texture;
} );

// -- greetings! -----------------------------------------------------------------------------------
const charPosList = [
  '0x4015',
  'Alcatraz',
  'Altair',
  'ASD',
  'Astronomena',
  'CNCD',
  'Cocoon',
  'Conspiracy',
  'Ctrl+Alt+Test',
  'doxas',
  'Fairlight',
  'Flopine',
  'FRONTL1NE',
  'holon',
  'gam0022',
  'gaz',
  'gyabo',
  'iYOYi',
  'jetlag',
  'Jugem-T',
  'kaneta',
  'Limp Ninja',
  'LJ',
  'Logicoma',
  'marcan',
  'Mercury',
  'mrdoob',
  'nikq::cube',
  'Ninjadev',
  'NuSan',
  'orange',
  'Poo-Brain',
  'Primitive',
  'Prismbeings',
  'Radium Software',
  'quite',
  'rgba',
  'Satori',
  'setchi',
  'sp4ghet',
  'Still',
  'Suricrasia Online',
  'tdhooper',
  'Ümlaüt Design',
  'Virgill',
  'Wrighter',
  'yx',
].map( ( text, iGreeting ) => {
  const style = styles[ iGreeting % styles.length ];
  const spacing = style.spacing ?? 1.0;
  const { totalWidth, chars } = calcCharPos( text, style.font );

  return {
    totalWidth: totalWidth * spacing,
    scaleY: style.scaleY ?? 1.0,
    chars: chars.map( ( { char, x } ) => ( {
      char: char.charCodeAt( 0 ),
      x: ( x - 0.5 * totalWidth ) / 96.0 * spacing * 1.4 // what the fuck is this magic number
    } ) ),
  };
} );

export class Greetings extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new InstancedGeometry();

    const bufferP = glCat.createBuffer();
    bufferP.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    geometry.vao.bindVertexbuffer( bufferP, 0, 2 );

    const arrayParams = new Float32Array( 4 * INSTANCES ); // char, posFromCenter, width, time
    const arrayParams2 = new Float32Array( 4 * INSTANCES ); // totalWidth, scaleY
    for ( let i = 0; i < INSTANCES; i ++ ) {
      arrayParams[ 4 * i + 0 ] = 0;
      arrayParams[ 4 * i + 1 ] = 0;
      arrayParams[ 4 * i + 2 ] = 0;
      arrayParams[ 4 * i + 3 ] = 0;
      arrayParams2[ 4 * i + 0 ] = 0;
    }

    const bufferParams = glCat.createBuffer();
    bufferParams.setVertexbuffer( arrayParams, gl.STREAM_DRAW );
    geometry.vao.bindVertexbuffer( bufferParams, 1, 4, 1 );

    const bufferParams2 = glCat.createBuffer();
    bufferParams2.setVertexbuffer( arrayParams2, gl.STREAM_DRAW );
    geometry.vao.bindVertexbuffer( bufferParams2, 2, 4, 1 );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;
    geometry.primcount = INSTANCES;

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      greetingsVert,
      greetingsFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    const materials = { forward };

    forward.addUniformTextureArray( 'samplerSpriteSheets', spritesheets );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/greetings.vert',
            '../shaders/greetings.frag',
          ],
          () => {
            forward.replaceShader( greetingsVert, greetingsFrag );
          }
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'Greetings/mesh',
    } );
    mesh.depthTest = false;
    mesh.depthWrite = false;

    // -- buffer updater ---------------------------------------------------------------------------
    let headInstance = 0;
    let headGreetings = 0;

    const lambda = new Lambda( {
      onUpdate: ( { time, deltaTime } ) => {
        if ( Math.floor( 8.0 * time ) === Math.floor( 8.0 * ( time - deltaTime ) ) ) {
          return;
        }

        const { totalWidth, scaleY, chars } = charPosList[ headGreetings ];

        chars.map( ( { char, x } ) => {
          arrayParams[ 4 * headInstance + 0 ] = char;
          arrayParams[ 4 * headInstance + 1 ] = x;
          arrayParams[ 4 * headInstance + 2 ] = headGreetings;
          arrayParams[ 4 * headInstance + 3 ] = time;
          arrayParams2[ 4 * headInstance + 0 ] = totalWidth;
          arrayParams2[ 4 * headInstance + 1 ] = scaleY;

          headInstance = ( headInstance + 1 ) % INSTANCES;
        } );

        headGreetings = ( headGreetings + 1 ) % charPosList.length;

        bufferParams.setVertexbuffer( arrayParams, gl.STREAM_DRAW );
        bufferParams2.setVertexbuffer( arrayParams2, gl.STREAM_DRAW );
      },
      name: process.env.DEV && 'Greetings/spawner',
    } );

    // -- components -------------------------------------------------------------------------------
    this.components.push(
      lambda,
      mesh,
    );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Greetings/active', ( { uninit } ) => {
      mesh.active = !uninit;
      mesh.visible = !uninit;
    } );
  }
}
