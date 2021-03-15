import { canvas } from './globals/canvas';
import { Dog } from './heck/Dog';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Lambda } from './heck/components/Lambda';
import { randomTexture } from './globals/randomTexture';
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
import { IBLLUT } from './entities/IBLLUT';
import { EnvironmentMap } from './entities/EnvironmentMap';
import { Cube } from './entities/Cube';
import { music } from './globals/music';
import { automaton } from './globals/automaton';
import { getCheckboxActive } from './globals/dom';

// == music ========================================================================================
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

// == scene ========================================================================================
let totalFrame = 0;
let isInitialFrame = true;

const dog = new Dog();

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

// -- bake -----------------------------------------------------------------------------------------
const ibllut = new IBLLUT();
dog.root.children.push( ibllut.entity );

const environmentMap = new EnvironmentMap();
dog.root.children.push( environmentMap.entity );

// -- "objects" ------------------------------------------------------------------------------------
const sphereParticles = new SphereParticles();
dog.root.children.push( sphereParticles.entity );

const trails = new Trails();
dog.root.children.push( trails.entity );

const rings = new Rings();
dog.root.children.push( rings.entity );

const cube = new Cube();
dog.root.children.push( cube.entity );

const flickyParticles = new FlickyParticles( {
  particlesSqrt: 8,
} );
dog.root.children.push( flickyParticles.entity );

const raymarcher = new Raymarcher();
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
light.color = [ 40.0, 40.0, 40.0 ];
light.entity.transform.lookAt( new Vector3( [ -1.0, 2.0, 8.0 ] ) );
dog.root.children.push( light.entity );

// const light2 = new LightEntity( {
//   root: dog.root,
//   shadowMapFov: 90.0,
//   shadowMapNear: 1.0,
//   shadowMapFar: 20.0,
//   namePrefix: process.env.DEV && 'light2',
// } );
// light2.color = [ 50.0, 30.0, 40.0 ];
// light2.entity.transform.lookAt( new Vector3( [ -4.0, -2.0, 6.0 ] ) );
// dog.root.children.push( light2.entity );

const camera = new CameraEntity( {
  root: dog.root,
  target: swap.o,
  lights: [
    light,
    // light2
  ],
  textureIBLLUT: ibllut.texture,
  textureEnv: environmentMap.texture,
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
  input: swap.i,
  target: swap.o
} );
dog.root.children.push( bloom.entity );

swap.swap();
const glitch = new Glitch( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( glitch.entity );

swap.swap();
const pixelSorter = new PixelSorter( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( pixelSorter.entity );

swap.swap();
const post = new Post( {
  input: swap.i,
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
  const checkboxActive = getCheckboxActive();

  window.addEventListener( 'keydown', ( event ) => {
    if ( event.key === 'Escape' ) { // panic button
      dog.root.active = false;
      music.isPlaying = false;
      checkboxActive.checked = false;
    }
  } );

  checkboxActive.addEventListener( 'input', ( event: any ) => {
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
