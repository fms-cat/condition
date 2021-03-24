import { Swap, Vector3 } from '@fms-cat/experimental';
import { Bloom } from './entities/Bloom';
import { CameraEntity } from './entities/CameraEntity';
import { Condition } from './entities/Condition';
import { Cube } from './entities/Cube';
import { CubemapCameraEntity } from './entities/CubemapCameraEntity';
import { EnvironmentMap } from './entities/EnvironmentMap';
import { FlickyParticles } from './entities/FlickyParticles';
import { Glitch } from './entities/Glitch';
import { IBLLUT } from './entities/IBLLUT';
import { LightEntity } from './entities/LightEntity';
import { PixelSorter } from './entities/PixelSorter';
import { Post } from './entities/Post';
import { Raymarcher } from './entities/Raymarcher';
import { Rings } from './entities/Rings';
import { RTInspector } from './entities/RTInspector';
import { SphereParticles } from './entities/SphereParticles';
import { SufferTexts } from './entities/SufferTexts';
import { Trails } from './entities/Trails';
import { auto, automaton } from './globals/automaton';
import { music } from './globals/music';
import { randomTexture } from './globals/randomTexture';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Component } from './heck/components/Component';
import { Lambda } from './heck/components/Lambda';
import { Dog } from './heck/Dog';
import { Entity } from './heck/Entity';
import { arraySetDelete } from './utils/arraySetDelete';

let totalFrame = 0;
let isInitialFrame = true;

// -- dog ------------------------------------------------------------------------------------------
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( {
  onUpdate: () => {
    totalFrame ++;
    isInitialFrame = false;

    if ( process.env.DEV ) {
      Component.gpuTimer!.update();
    }

    randomTexture.update();
    automaton.update( music.time );
  },
  name: process.env.DEV && 'main/update',
} ) );

// -- util -----------------------------------------------------------------------------------------
class EntityReplacer<T extends Entity> {
  public current!: T;
  public creator: () => T;

  public constructor( creator: () => T, name?: string ) {
    this.creator = creator;
    this.replace();

    if ( name ) {
      auto( `${ name }/active`, ( { uninit } ) => {
        const entity = this.current;
        if ( entity ) {
          entity.active = !uninit;
          entity.visible = !uninit;
        }
      } );
    }
  }

  public replace(): void {
    if ( process.env.DEV ) {
      if ( this.current ) {
        arraySetDelete( dog.root.children, this.current );
      }
    }

    this.current = this.creator();
    dog.root.children.push( this.current );

    // not visible by default
    this.current.active = false;
    this.current.visible = false;
  }
}

// -- bake -----------------------------------------------------------------------------------------
const ibllut = new IBLLUT();
dog.root.children.push( ibllut.entity );

// -- "objects" ------------------------------------------------------------------------------------
const replacerSphereParticles = new EntityReplacer(
  () => new SphereParticles(),
  'SphereParticles',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SphereParticles', () => {
    replacerSphereParticles.replace();
  } );
}

const replacerSVGTest = new EntityReplacer( () => new Condition(), 'Condition' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Condition', () => {
    replacerSVGTest.replace();
  } );
}

const replacerTrails = new EntityReplacer( () => new Trails(), 'Trails' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Trails', () => {
    replacerTrails.replace();
  } );
}

const replacerRings = new EntityReplacer( () => new Rings(), 'Rings' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Rings', () => {
    replacerRings.replace();
  } );
}

const replacerCube = new EntityReplacer( () => new Cube(), 'Cube' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Cube', () => {
    replacerCube.replace();
  } );
}

const replacerFlickyParticles = new EntityReplacer(
  () => new FlickyParticles(),
  'FlickyParticles',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/FlickyParticles', () => {
    replacerFlickyParticles.replace();
  } );
}

const replacerSufferTexts = new EntityReplacer(
  () => new SufferTexts(),
  'SufferTexts',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SufferTexts', () => {
    replacerSufferTexts.replace();
  } );
}

const replacerRaymarcher = new EntityReplacer( () => new Raymarcher(), 'Raymarcher' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Raymarcher', () => {
    replacerRaymarcher.replace();
  } );
}

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

const replacerLightFirst = new EntityReplacer( () => {
  const light = new LightEntity( {
    root: dog.root,
    shadowMapFov: 90.0,
    shadowMapNear: 1.0,
    shadowMapFar: 20.0,
    namePrefix: process.env.DEV && 'lightFirst',
  } );
  light.color = [ 1.0, 1.0, 1.0 ];
  light.transform.lookAt( new Vector3( [ -1.0, 2.0, 8.0 ] ) );
  return light;
}, 'LightFirst' );
const lightFirst = replacerLightFirst.current;

const replacerLightPink = new EntityReplacer( () => {
  const light = new LightEntity( {
    root: dog.root,
    shadowMapFov: 90.0,
    shadowMapNear: 1.0,
    shadowMapFar: 20.0,
    namePrefix: process.env.DEV && 'lightPink',
  } );
  light.color = [ 60.0, 1.0, 5.0 ];
  light.transform.lookAt( new Vector3( [ -1.0, 2.0, 8.0 ] ) );
  return light;
}, 'LightPink' );
const lightPink = replacerLightPink.current;

if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/LightEntity', () => {
    replacerLightFirst.replace();
    replacerLightPink.replace();
  } );
}

// const light2 = new LightEntity( {
//   root: dog.root,
//   shadowMapFov: 90.0,
//   shadowMapNear: 1.0,
//   shadowMapFar: 20.0,
//   namePrefix: process.env.DEV && 'light2',
// } );
// light2.color = [ 50.0, 30.0, 40.0 ];
// light2.transform.lookAt( new Vector3( [ -4.0, -2.0, 6.0 ] ) );
// dog.root.children.push( light2 );

const cubemapCamera = new CubemapCameraEntity( {
  root: dog.root,
  lights: [
    lightFirst,
    lightPink,
    // light2
  ],
} );
dog.root.children.push( cubemapCamera );

const environmentMap = new EnvironmentMap( {
  cubemap: cubemapCamera.target,
} );
dog.root.children.push( environmentMap );

const camera = new CameraEntity( {
  root: dog.root,
  target: swap.o,
  lights: [
    lightFirst,
    lightPink,
    // light2
  ],
  textureIBLLUT: ibllut.texture,
  textureEnv: environmentMap.texture,
} );
camera.camera.clear = [ 0.0, 0.0, 0.0, 0.0 ];
camera.components.unshift( new Lambda( {
  onUpdate: ( { time } ) => {
    const r = auto( 'Camera/r' );
    const t = auto( 'Camera/t' );
    const p = auto( 'Camera/p' );

    const st = Math.sin( t );
    const ct = Math.cos( t );
    const sp = Math.sin( p );
    const cp = Math.cos( p );

    const wubPosAmp = 0.01;
    const wubPosTheta = 3.0 * time;
    const wubTarAmp = 0.02;
    const wubTarTheta = 4.21 * time;

    camera.transform.lookAt(
      new Vector3( [
        r * ct * sp + wubPosAmp * Math.sin( wubPosTheta ),
        r * st + wubPosAmp * Math.sin( 2.0 + wubPosTheta ),
        r * ct * cp + wubPosAmp * Math.sin( 4.0 + wubPosTheta ),
      ] ),
      new Vector3( [
        wubTarAmp * Math.sin( wubTarTheta ),
        wubTarAmp * Math.sin( 2.0 + wubTarTheta ),
        wubTarAmp * Math.sin( 4.0 + wubTarTheta ),
      ] ),
      undefined,
      0.02 * Math.sin( 2.74 * time ),
    );
  },
  name: process.env.DEV && 'main/updateCamera',
} ) );
dog.root.children.push( camera );

swap.swap();
const bloom = new Bloom( {
  input: swap.i,
  target: swap.o
} );
dog.root.children.push( bloom );

swap.swap();
const glitch = new Glitch( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( glitch );

swap.swap();
const pixelSorter = new PixelSorter( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( pixelSorter );

swap.swap();
const post = new Post( {
  input: swap.i,
  target: canvasRenderTarget
} );
dog.root.children.push( post );

if ( process.env.DEV ) {
  const rtInspector = new RTInspector( {
    target: canvasRenderTarget
  } );
  dog.root.children.push( rtInspector );
}
