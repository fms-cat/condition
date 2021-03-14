import { Automaton } from '@fms-cat/automaton';
import { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';
import * as automatonFxs from './automaton-fxs/automatonFxs';
import { Music } from './Music';
import automatonData from './automaton.json';
import { canvas, glCat } from './heck/canvas';
import { Dog } from './heck/Dog';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Lambda } from './heck/components/Lambda';
import { RandomTexture } from './utils/RandomTexture';
import { RANDOM_RESOLUTION, STATIC_RANDOM_RESOLUTION } from './config';
import { SphereParticles } from './entities/SphereParticles';
import { Swap, Vector3 } from '@fms-cat/experimental';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { CameraEntity } from './entities/CameraEntity';
import { LightEntity } from './entities/LightEntity';
import { Bloom } from './entities/Bloom';
import { Post } from './entities/Post';
import { Raymarcher } from './entities/Raymarcher';
import { Trails } from './entities/Trails';
import { Glitch } from './entities/Glitch';
import { Rings } from './entities/Rings';
import { RTInspector } from './entities/RTInspector';
import { Component } from './heck/components/Component';
import { FlickyParticles } from './entities/FlickyParticles';
import { PixelSorter } from './entities/PixelSorter';

// == music ========================================================================================
const audio = new AudioContext();
const music = new Music( glCat, audio );

if ( process.env.DEV ) {
  music.isPlaying = true;
}

// == dom ==========================================================================================
document.body.style.margin = '0';
document.body.style.padding = '0';

if ( process.env.DEV ) {
  document.body.style.background = '#000';
  document.body.style.width = '100%';

  document.body.appendChild( canvas );
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = 'calc( 100% - 240px )';

  window.divPath = document.createElement( 'div' );
  document.body.appendChild( window.divPath );
  window.divPath.style.position = 'fixed';
  window.divPath.style.textAlign = 'right';
  window.divPath.style.right = '8px';
  window.divPath.style.bottom = '248px';
  window.divPath.style.textShadow = '1px 1px 1px #ffffff';

  window.divAutomaton = document.createElement( 'div' );
  document.body.appendChild( window.divAutomaton );
  window.divAutomaton.style.position = 'fixed';
  window.divAutomaton.style.width = '100%';
  window.divAutomaton.style.height = '240px';
  window.divAutomaton.style.right = '0';
  window.divAutomaton.style.bottom = '0';

  window.checkActive = document.createElement( 'input' );
  document.body.appendChild( window.checkActive );
  window.checkActive.type = 'checkbox';
  window.checkActive.checked = true;
  window.checkActive.style.position = 'fixed';
  window.checkActive.style.left = '8px';
  window.checkActive.style.bottom = '248px';

  window.divComponentsUpdate = document.createElement( 'div' );
  document.body.appendChild( window.divComponentsUpdate );
  window.divComponentsUpdate.style.whiteSpace = 'pre';
  window.divComponentsUpdate.style.color = '#ffffff';
  window.divComponentsUpdate.style.font = '500 10px Wt-Position-Mono';
  window.divComponentsUpdate.style.position = 'fixed';
  window.divComponentsUpdate.style.padding = '0';
  window.divComponentsUpdate.style.boxSizing = 'border-box';
  window.divComponentsUpdate.style.width = '240px';
  window.divComponentsUpdate.style.height = 'calc( ( 100% - 240px ) * 0.5 )';
  window.divComponentsUpdate.style.right = '0';
  window.divComponentsUpdate.style.top = '0';
  window.divComponentsUpdate.style.overflowY = 'scroll';

  window.divComponentsDraw = document.createElement( 'div' );
  document.body.appendChild( window.divComponentsDraw );
  window.divComponentsDraw.style.whiteSpace = 'pre';
  window.divComponentsDraw.style.color = '#ffffff';
  window.divComponentsDraw.style.font = '500 10px Wt-Position-Mono';
  window.divComponentsDraw.style.position = 'fixed';
  window.divComponentsDraw.style.padding = '0';
  window.divComponentsDraw.style.boxSizing = 'border-box';
  window.divComponentsDraw.style.width = '240px';
  window.divComponentsDraw.style.height = 'calc( ( 100% - 240px ) * 0.5 )';
  window.divComponentsDraw.style.right = '0';
  window.divComponentsDraw.style.top = 'calc( ( 100% - 240px ) * 0.5 )';
  window.divComponentsDraw.style.overflowY = 'scroll';
} else {
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';
  document.body.style.height = canvas.style.height = '100%';

  const button = document.createElement( 'a' );
  document.body.appendChild( button );
  button.innerHTML = 'click me!';

  button.onclick = () => {
    document.body.appendChild( canvas );
    music.isPlaying = true;
    document.body.requestFullscreen();
  };
}

// == automaton ====================================================================================
let totalFrame = 0;
let isInitialFrame = true;

let automaton: Automaton;

if ( process.env.DEV ) {
  // this cast smells so bad
  // https://github.com/FMS-Cat/automaton/issues/121
  const automatonWithGUI = new AutomatonWithGUI(
    automatonData,
    {
      gui: window.divAutomaton,
      isPlaying: true,
      fxDefinitions: automatonFxs,
    }
  );

  automatonWithGUI.on( 'play', () => { music.isPlaying = true; } );
  automatonWithGUI.on( 'pause', () => { music.isPlaying = false; } );
  automatonWithGUI.on( 'seek', ( { time } ) => {
    music.time = Math.max( 0.0, time );
    automaton.reset();
  } );

  if ( module.hot ) {
    module.hot.accept( './automaton.json', () => {
      // we probably don't need this feature for now...
      // See: https://github.com/FMS-Cat/automaton/issues/120
      // automatonWithGUI.deserialize( automatonData );
    } );
  }

  automaton = automatonWithGUI;
} else {
  // this cast smells so bad
  // https://github.com/FMS-Cat/automaton/issues/121
  automaton = new Automaton(
    automatonData,
    {
      fxDefinitions: automatonFxs
    }
  );
}

// == textures =====================================================================================
const randomTexture = new RandomTexture(
  glCat,
  RANDOM_RESOLUTION[ 0 ],
  RANDOM_RESOLUTION[ 1 ]
);
randomTexture.update();

const randomTextureStatic = new RandomTexture(
  glCat,
  STATIC_RANDOM_RESOLUTION[ 0 ],
  STATIC_RANDOM_RESOLUTION[ 1 ]
);
randomTextureStatic.update();

// == scene ========================================================================================
const dog = new Dog( music );

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( {
  onUpdate: () => {
    totalFrame ++;
    isInitialFrame = false;

    randomTexture.update();
    automaton.update( music.time );
  },
  visible: false,
  name: process.env.DEV && 'main/update',
} ) );

// -- "objects" ------------------------------------------------------------------------------------
const sphereParticles = new SphereParticles( {
  particlesSqrt: 256,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( sphereParticles.entity );

const trails = new Trails( {
  trails: 4096,
  trailLength: 64,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( trails.entity );

const rings = new Rings();
dog.root.children.push( rings.entity );

const flickyParticles = new FlickyParticles( {
  particlesSqrt: 8,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture,
} );
dog.root.children.push( flickyParticles.entity );

const raymarcher = new Raymarcher( {
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( raymarcher.entity );

// -- things that is not an "object" ---------------------------------------------------------------
const swapOptions = {
  width: canvasRenderTarget.width,
  height: canvasRenderTarget.height
};

const swap = new Swap(
  new BufferRenderTarget( {
    ...swapOptions,
    name: process.env.DEV && 'main/postSwap0',
  } ),
  new BufferRenderTarget( {
    ...swapOptions,
    name: process.env.DEV && 'main/postSwap1',
  } ),
);

const light = new LightEntity( {
  root: dog.root,
  shadowMapFov: 90.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  namePrefix: process.env.DEV && 'light1',
} );
light.color = [ 60.0, 60.0, 60.0 ];
light.entity.transform.lookAt( new Vector3( [ -1.0, 2.0, 8.0 ] ) );
dog.root.children.push( light.entity );

const light2 = new LightEntity( {
  root: dog.root,
  shadowMapFov: 90.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  namePrefix: process.env.DEV && 'light2',
} );
light2.color = [ 50.0, 30.0, 40.0 ];
light2.entity.transform.lookAt( new Vector3( [ -4.0, -2.0, 6.0 ] ) );
dog.root.children.push( light2.entity );

const camera = new CameraEntity( {
  root: dog.root,
  target: swap.o,
  lights: [
    light,
    // light2
  ],
  textureRandom: randomTexture.texture
} );
camera.camera.clear = [ 0.0, 0.0, 0.0, 0.0 ];
camera.entity.components.unshift( new Lambda( {
  onUpdate: ( event ) => {
    const t1 = 0.02 * Math.sin( event.time );
    const s1 = Math.sin( t1 );
    const c1 = Math.cos( t1 );
    const t2 = 0.02 * Math.cos( event.time );
    const s2 = Math.sin( t2 );
    const c2 = Math.cos( t2 );
    const r = 5.0;

    camera.entity.transform.lookAt( new Vector3( [
      r * c1 * s2,
      r * s1,
      r * c1 * c2
    ] ) );
  },
  visible: false,
  name: process.env.DEV && 'main/updateCamera',
} ) );
dog.root.children.push( camera.entity );

swap.swap();
const bloom = new Bloom( {
  input: swap.i.texture,
  target: swap.o
} );
dog.root.children.push( bloom.entity );

swap.swap();
const glitch = new Glitch( {
  input: swap.i.texture,
  target: swap.o,
  automaton,
} );
dog.root.children.push( glitch.entity );

swap.swap();
const pixelSorter = new PixelSorter( {
  input: swap.i.texture,
  target: swap.o,
  automaton,
} );
dog.root.children.push( pixelSorter.entity );

swap.swap();
const post = new Post( {
  input: swap.i.texture,
  target: canvasRenderTarget
} );
dog.root.children.push( post.entity );

if ( process.env.DEV ) {
  const rtInspector = new RTInspector( {
    target: canvasRenderTarget
  } );
  dog.root.children.push( rtInspector.entity );
}

// -- keyboards ------------------------------------------------------------------------------------
if ( process.env.DEV ) {
  window.addEventListener( 'keydown', ( event ) => {
    if ( event.key === 'Escape' ) { // panic button
      dog.root.active = false;
      music.isPlaying = false;
      window.checkActive!.checked = false;
    }
  } );

  window.checkActive!.addEventListener( 'input', ( event: any ) => {
    dog.root.active = event.target.checked;
    music.isPlaying = event.target.checked;
  } );
}

if ( !process.env.DEV ) {
  window.addEventListener( 'keydown', ( event ) => {
    if ( event.key === 'Escape' ) { // panic button
      dog.root.active = false;
      music.isPlaying = false;
    }
  } );
}

// -- wenis ----------------------------------------------------------------------------------------
if ( process.env.DEV ) {
  console.info( Component.nameMap );
  console.info( BufferRenderTarget.nameMap );
}
