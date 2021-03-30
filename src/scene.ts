import { Antialias } from './entities/Antialias';
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
import { FlashyTerrain } from './entities/FlashyTerrain';
import { FlickyParticles } from './entities/FlickyParticles';
import { ForwardCamera } from './entities/ForwardCamera';
import { Glitch } from './entities/Glitch';
import { IBLLUT } from './entities/IBLLUT';
import { Lambda } from './heck/components/Lambda';
import { PixelSorter } from './entities/PixelSorter';
import { Post } from './entities/Post';
import { RTInspector } from './entities/RTInspector';
import { SceneBegin } from './entities/SceneBegin';
import { SceneCrystals } from './entities/SceneCrystals';
import { SceneNeuro } from './entities/SceneNeuro';
import { Serial } from './entities/Serial';
import { SphereParticles } from './entities/SphereParticles';
import { Swap, Vector3 } from '@fms-cat/experimental';
import { Trails } from './entities/Trails';
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
  private __root: Entity;
  public current!: T;
  public creator: () => T;

  public constructor( root: Entity, creator: () => T, name?: string ) {
    this.__root = root;
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
        arraySetDelete( this.__root.children, this.current );
      }
    }

    this.current = this.creator();
    this.__root.children.push( this.current );

    // not visible by default
    this.current.active = false;
    this.current.visible = false;
  }
}

// -- bake -----------------------------------------------------------------------------------------
const ibllut = new IBLLUT();
dog.root.children.push( ibllut.entity );

// -- deferred stuff -------------------------------------------------------------------------------
const deferredRoot = new Entity();
dog.root.children.push( deferredRoot );

const replacerSphereParticles = new EntityReplacer(
  deferredRoot,
  () => new SphereParticles(),
  'SphereParticles',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SphereParticles', () => {
    replacerSphereParticles.replace();
  } );
}

const replacerFlashyTerrain = new EntityReplacer(
  deferredRoot,
  () => new FlashyTerrain(),
  'FlashyTerrain',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/FlashyTerrain', () => {
    replacerFlashyTerrain.replace();
  } );
}

const replacerTrails = new EntityReplacer( deferredRoot, () => new Trails(), 'Trails' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/Trails', () => {
    replacerTrails.replace();
  } );
}

const replacerSceneBegin = new EntityReplacer( deferredRoot, () => new SceneBegin(), 'SceneBegin' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneBegin', () => {
    replacerSceneBegin.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerSceneBegin.replace();
    lights.push( ...replacerSceneBegin.current.lights );
  } );
}

const replacerSceneNeuro = new EntityReplacer( deferredRoot, () => new SceneNeuro(), 'SceneNeuro' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneNeuro', () => {
    replacerSceneNeuro.current.lights.map( ( light ) => arraySetDelete( lights, light ) );
    replacerSceneNeuro.replace();
    lights.push( ...replacerSceneNeuro.current.lights );
    replacerSceneNeuro.current.setDefferedCameraTarget( deferredCamera.cameraTarget );
  } );
}

const replacerSceneCrystals = new EntityReplacer( deferredRoot, () => new SceneCrystals(), 'SceneCrystals' );
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/SceneCrystals', () => {
    replacerSceneCrystals.replace();
  } );
}

// -- forward stuff --------------------------------------------------------------------------------
const forwardRoot = new Entity();
dog.root.children.push( forwardRoot );

const replacerFlickyParticles = new EntityReplacer(
  forwardRoot,
  () => new FlickyParticles(),
  'FlickyParticles',
);
if ( process.env.DEV && module.hot ) {
  module.hot.accept( './entities/FlickyParticles', () => {
    replacerFlickyParticles.replace();
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
            Math.sin( 145.0 * time ),
            Math.sin( 2.0 + 148.0 * time ),
            Math.sin( 4.0 + 151.0 * time )
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

// -- post -----------------------------------------------------------------------------------------
swap.swap();
const antialias = new Antialias( {
  input: swap.i,
  target: swap.o
} );
dog.root.children.push( antialias );

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

if ( process.env.DEV ) {
  const rtInspector = new RTInspector( {
    target: canvasRenderTarget
  } );
  dog.root.children.push( rtInspector );
}
