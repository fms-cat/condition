import { Antialias } from './entities/Antialias';
import { BigBlur } from './entities/BigBlur';
import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Component } from './heck/components/Component';
import { CubemapCameraEntity } from './entities/CubemapCameraEntity';
import { DVi } from './entities/DVi';
import { DeferredCamera } from './entities/DeferredCamera';
import { Dog } from './heck/Dog';
import { Entity } from './heck/Entity';
import { EnvironmentMap } from './entities/EnvironmentMap';
import { FlashyBall } from './entities/FlashyBall';
import { FlickyParticles } from './entities/FlickyParticles';
import { ForwardCamera } from './entities/ForwardCamera';
import { Glitch } from './entities/Glitch';
import { IBLLUT } from './entities/IBLLUT';
import { IFSAsUsual } from './entities/IFSAsUsual';
import { Lambda } from './heck/components/Lambda';
import { NoiseVoxels } from './entities/NoiseVoxels';
import { PixelSorter } from './entities/PixelSorter';
import { Post } from './entities/Post';
import { RTInspector } from './entities/RTInspector';
import { SSR } from './entities/SSR';
import { SceneBegin } from './entities/SceneBegin';
import { SceneCrystals } from './entities/SceneCrystals';
import { SceneDynamic } from './entities/SceneDynamic';
import { SceneNeuro } from './entities/SceneNeuro';
import { ScenePsy } from './entities/ScenePsy';
import { Serial } from './entities/Serial';
import { SphereParticles } from './entities/SphereParticles';
import { SufferTexts } from './entities/SufferTexts';
import { Swap, Vector3 } from '@fms-cat/experimental';
import { TestScreen } from './entities/TestScreen';
import { Tetrahedron } from './entities/Tetrahedron';
import { TextOverlay } from './entities/TextOverlay';
import { arraySetDelete } from './utils/arraySetDelete';
import { auto, automaton } from './globals/automaton';
import { music } from './globals/music';
import { randomTexture } from './globals/randomTexture';

// -- dog ------------------------------------------------------------------------------------------
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( {
  onUpdate: () => {
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

const replacerSphereParticles = new EntityReplacer(
  () => new SphereParticles(),
  'SphereParticles',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SphereParticles', () => {
    replacerSphereParticles.replace();
  } );
}

const replacerFlashyBall = new EntityReplacer(
  () => new FlashyBall(),
  'FlashyBall',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/FlashyBall', () => {
    replacerFlashyBall.replace();
  } );
}

const replacerTetrahedron = new EntityReplacer(
  () => new Tetrahedron(),
  'Tetrahedron',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Tetrahedron', () => {
    replacerTetrahedron.replace();
  } );
}

const replacerNoiseVoxels = new EntityReplacer(
  () => new NoiseVoxels(),
  'NoiseVoxels',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/NoiseVoxels', () => {
    replacerNoiseVoxels.replace();
  } );
}

const replacerIFSAsUsual = new EntityReplacer(
  () => new IFSAsUsual(),
  'IFSAsUsual',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/IFSAsUsual', () => {
    replacerIFSAsUsual.replace();
  } );
}

const replacerSceneBegin = new EntityReplacer(
  () => new SceneBegin( { scenes: [ dog.root ] } ),
  'SceneBegin'
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneBegin', () => {
    replacerSceneBegin.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerSceneBegin.replace();
    lights.push( ...replacerSceneBegin.current.lights );
  } );
}

const replacerSceneDynamic = new EntityReplacer(
  () => new SceneDynamic( { scenes: [ dog.root ] } ),
  'SceneDynamic',
);

if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneDynamic', () => {
    replacerSceneDynamic.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerSceneDynamic.replace();
    lights.push( ...replacerSceneDynamic.current.lights );
    replacerSceneDynamic.current.setDefferedCameraTarget( deferredCamera.cameraTarget );
  } );
}

const replacerSceneNeuro = new EntityReplacer(
  () => new SceneNeuro( { scenes: [ dog.root ] } ),
  'SceneNeuro'
);

if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneNeuro', () => {
    replacerSceneNeuro.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerSceneNeuro.replace();
    lights.push( ...replacerSceneNeuro.current.lights );
    replacerSceneNeuro.current.setDefferedCameraTarget( deferredCamera.cameraTarget );
  } );
}

const replacerSceneCrystals = new EntityReplacer(
  () => new SceneCrystals( { scenes: [ dog.root ] } ),
  'SceneCrystals',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneCrystals', () => {
    replacerSceneCrystals.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerSceneCrystals.replace();
    lights.push( ...replacerSceneCrystals.current.lights );
    replacerSceneCrystals.current.setDefferedCameraTarget( deferredCamera.cameraTarget );
  } );
}

const replacerScenePsy = new EntityReplacer(
  () => new ScenePsy( { scenes: [ dog.root ] } ),
  'ScenePsy'
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/ScenePsy', () => {
    replacerScenePsy.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerScenePsy.replace();
    lights.push( ...replacerScenePsy.current.lights );
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

const lights = [
  ...replacerSceneBegin.current.lights,
  ...replacerSceneNeuro.current.lights,
  ...replacerSceneDynamic.current.lights,
  ...replacerSceneCrystals.current.lights,
  ...replacerScenePsy.current.lights,
];

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
  scenes: [ dog.root ],
  lights,
} );
dog.root.children.push( cubemapCamera );

const environmentMap = new EnvironmentMap( {
  cubemap: cubemapCamera.target,
} );
dog.root.children.push( environmentMap );

// -- camera ---------------------------------------------------------------------------------------
const deferredCamera = new DeferredCamera( {
  scenes: [ dog.root ],
  target: swap.o,
  lights,
  textureIBLLUT: ibllut.texture,
  textureEnv: environmentMap.texture,
} );
dog.root.children.push( deferredCamera );
replacerSceneNeuro.current.setDefferedCameraTarget( deferredCamera.cameraTarget );
replacerSceneDynamic.current.setDefferedCameraTarget( deferredCamera.cameraTarget );
replacerSceneCrystals.current.setDefferedCameraTarget( deferredCamera.cameraTarget );

const forwardCamera = new ForwardCamera( {
  scenes: [ dog.root ],
  target: swap.o,
  lights,
} );
dog.root.children.push( forwardCamera );

dog.root.components.push( new Lambda( {
  onUpdate: ( { time } ) => {
    const r = auto( 'Camera/rot/r' );
    const t = auto( 'Camera/rot/t' );
    const p = auto( 'Camera/rot/p' );
    const x = auto( 'Camera/pos/x' );
    const y = auto( 'Camera/pos/y' );
    const z = auto( 'Camera/pos/z' );
    const roll = auto( 'Camera/roll' );
    const shake = auto( 'Camera/shake' );

    const st = Math.sin( t );
    const ct = Math.cos( t );
    const sp = Math.sin( p );
    const cp = Math.cos( p );

    const wubPosAmp = 0.01;
    const wubPosTheta = 3.0 * time;
    const wubTarAmp = 0.02;
    const wubTarTheta = 4.21 * time;

    [ deferredCamera, forwardCamera ].map( ( camera ) => {
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
        0.02 * Math.sin( 2.74 * time ) + roll,
      );

      camera.transform.position = camera.transform.position.add(
        new Vector3( [ x, y, z ] )
      );

      if ( shake > 0.0 ) {
        camera.transform.position = camera.transform.position.add(
          new Vector3( [
            Math.sin( 45.0 * time ),
            Math.sin( 2.0 + 48.0 * time ),
            Math.sin( 4.0 + 51.0 * time )
          ] ).scale( shake )
        );
      }

      auto( 'Camera/fov', ( { value } ) => {
        camera.camera.fov = 90.0 * value;
      } );
    } );
  },
  name: process.env.DEV && 'main/updateCamera',
} ) );

swap.swap();
const ssr = new SSR( {
  camera: deferredCamera,
  shaded: swap.i,
  target: swap.o,
} );
dog.root.children.push( ssr );

// -- post -----------------------------------------------------------------------------------------
swap.swap();
const antialias = new Antialias( {
  input: swap.i,
  target: swap.o
} );
dog.root.children.push( antialias );

swap.swap();
const bigBlur = new BigBlur( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( bigBlur );

const textOverlay = new TextOverlay( {
  target: swap.o,
} );
dog.root.children.push( textOverlay );

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
const serial = new Serial( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( serial );

swap.swap();
const dvi = new DVi( {
  input: swap.i,
  target: swap.o,
} );
dog.root.children.push( dvi );

swap.swap();
const post = new Post( {
  input: swap.i,
  target: canvasRenderTarget
} );
dog.root.children.push( post );

const testScreen = new TestScreen( {
  target: canvasRenderTarget
} );
dog.root.children.push( testScreen );

if ( process.env.DEV ) {
  const rtInspector = new RTInspector( {
    target: canvasRenderTarget
  } );
  dog.root.children.push( rtInspector );
}
