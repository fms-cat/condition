import { Camera } from './Camera';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { COMPONENT_DRAW_BREAKPOINT, COMPONENT_UPDATE_BREAKPOINT } from '../../config-hot';
import { GPUTimer } from '../GPUTimer';
import { getDivComponentsDraw, getDivComponentsUpdate } from '../../globals/dom';
import { MaterialTag } from '../Material';

export interface ComponentUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  entity: Entity;
}

export interface ComponentDrawEvent {
  frameCount: number;
  time: number;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  entity: Entity;
}

export interface ComponentOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
  ignoreBreakpoints?: boolean;
}

export class Component {
  public static gpuTimer?: GPUTimer;
  public static updateList?: Promise<{ name?: string; cpu: number; gpu: number; }>[];
  public static drawList?: Promise<{ name?: string; cpu: number; gpu: number; }>[];
  public static nameMap = new Map<string, Component>();
  private static __updateHaveReachedBreakpoint = false;
  private static __drawHaveReachedBreakpoint = false;

  public static resetUpdateBreakpoint(): void {
    if ( process.env.DEV ) {
      const divComponentsUpdate = getDivComponentsUpdate();

      if ( Component.updateList != null ) {
        Promise.all( Component.updateList ).then( ( list ) => {
          let accumCpu = 0.0;
          let accumGpu = 0.0;

          const strEach = list.map( ( { name, cpu, gpu } ) => {
            accumCpu += cpu;
            accumGpu += gpu;
            return `${ cpu.toFixed( 3 ) }, ${ gpu.toFixed( 3 ) } - ${ name }`;
          } ).join( '\n' );

          const strAccum = `${ accumCpu.toFixed( 3 ) }, ${ accumGpu.toFixed( 3 ) } - UPDATE\n`;
          divComponentsUpdate.innerHTML = strAccum + strEach;
        } );
      }
      Component.updateList = [];

      this.__updateHaveReachedBreakpoint = false;
    }
  }

  public static resetDrawBreakpoint(): void {
    if ( process.env.DEV ) {
      const divComponentsDraw = getDivComponentsDraw();

      if ( Component.drawList != null ) {
        Promise.all( Component.drawList ).then( ( list ) => {
          let accumCpu = 0.0;
          let accumGpu = 0.0;

          const strEach = list.map( ( { name, cpu, gpu } ) => {
            accumCpu += cpu;
            accumGpu += gpu;
            return `${ cpu.toFixed( 3 ) }, ${ gpu.toFixed( 3 ) } - ${ name }`;
          } ).join( '\n' );

          const strAccum = `${ accumCpu.toFixed( 3 ) }, ${ accumGpu.toFixed( 3 ) } - DRAW\n`;
          divComponentsDraw.innerHTML = strAccum + strEach;
        } );
      }
      Component.drawList = [];

      this.__drawHaveReachedBreakpoint = false;
    }
  }

  protected __lastUpdateFrame = 0;

  public active: boolean;
  public visible: boolean;

  private __name?: string;
  public get name(): string | undefined {
    return this.__name;
  }
  public set name( name: string | undefined ) {
    if ( process.env.DEV ) {
      // remove previous one from the nameMap
      if ( this.__name != null ) {
        Component.nameMap.delete( this.__name );
      }

      this.__name = name;

      // set the current one to the nameMap
      if ( name != null ) {
        if ( Component.nameMap.has( name ) ) {
          console.warn( `Duplicated Component name, ${ name }` );
          return;
        }

        Component.nameMap.set( name, this );
      } else {
        console.warn( 'Component without name' );
      }
    }
  }

  public ignoreBreakpoints?: boolean;

  public constructor( options?: ComponentOptions ) {
    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    if ( process.env.DEV ) {
      this.name = options?.name;
      this.ignoreBreakpoints = options?.ignoreBreakpoints;

      Component.gpuTimer = new GPUTimer();
    }
  }

  public update( event: ComponentUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.__lastUpdateFrame === event.frameCount ) { return; }
    this.__lastUpdateFrame = event.frameCount;

    if ( process.env.DEV ) {
      if ( Component.__updateHaveReachedBreakpoint && !this.ignoreBreakpoints ) {
        return;
      }
    }

    if ( process.env.DEV ) {
      let cpu: number;

      Component.updateList?.push(
        Component.gpuTimer!.measure( () => {
          const begin = performance.now();
          this.__updateImpl( event );
          cpu = ( performance.now() - begin ) * 0.001;
        } ).then( ( gpu ) => ( { name: this.name, cpu, gpu } ) )
      );
    } else {
      this.__updateImpl( event );
    }

    if ( process.env.DEV ) {
      if ( COMPONENT_UPDATE_BREAKPOINT != null && COMPONENT_UPDATE_BREAKPOINT === this.name ) {
        Component.__updateHaveReachedBreakpoint = true;
      }
    }
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void { // eslint-disable-line
    // do nothing
  }

  public draw( event: ComponentDrawEvent ): void {
    if ( !this.visible ) { return; }

    if ( process.env.DEV ) {
      if ( Component.__drawHaveReachedBreakpoint && !this.ignoreBreakpoints ) {
        return;
      }
    }

    if ( process.env.DEV ) {
      let cpu: number;

      Component.drawList?.push(
        Component.gpuTimer!.measure( () => {
          const begin = performance.now();
          this.__drawImpl( event );
          cpu = ( performance.now() - begin ) * 0.001;
        } ).then( ( gpu ) => ( { name: this.name, cpu, gpu } ) )
      );
    } else {
      this.__drawImpl( event );
    }

    if ( process.env.DEV ) {
      if ( COMPONENT_DRAW_BREAKPOINT != null && COMPONENT_DRAW_BREAKPOINT === this.name ) {
        Component.__drawHaveReachedBreakpoint = true;
      }
    }
  }

  protected __drawImpl( event: ComponentDrawEvent ): void { // eslint-disable-line
    // do nothing
  }
}

if ( process.env.DEV ) {
  const checkBreakpointNames = () => {
    if (
      COMPONENT_UPDATE_BREAKPOINT != null &&
      Component.nameMap.get( COMPONENT_UPDATE_BREAKPOINT ?? '' ) == null
    ) {
      console.warn( `Component: Cannot retrieve a component, COMPONENT_UPDATE_BREAKPOINT: ${ COMPONENT_UPDATE_BREAKPOINT }` );
    }

    if (
      COMPONENT_DRAW_BREAKPOINT != null &&
      Component.nameMap.get( COMPONENT_DRAW_BREAKPOINT ?? '' ) == null
    ) {
      console.warn( `Component: Cannot retrieve a component, COMPONENT_DRAW_BREAKPOINT: ${ COMPONENT_DRAW_BREAKPOINT }` );
    }
  };
  checkBreakpointNames();

  if ( module.hot ) {
    module.hot.accept( '../../config-hot', () => {
      checkBreakpointNames();
    } );
  }
}
