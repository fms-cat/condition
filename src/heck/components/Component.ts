import { COMPONENT_DRAW_BREAKPOINT, COMPONENT_DRAW_PATTERN, COMPONENT_UPDATE_BREAKPOINT, COMPONENT_UPDATE_PATTERN } from '../../config-hot';
import { Camera } from './Camera';
import { Entity } from '../Entity';
import { GPUTimer } from '../GPUTimer';
import { MaterialTag } from '../Material';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { getDivComponentsDraw, getDivComponentsUpdate } from '../../globals/dom';

export interface ComponentUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  entity: Entity;
  path: string;
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
  path: string;
}

export interface ComponentOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
  ignoreBreakpoints?: boolean;
}

export class Component {
  public static gpuTimer?: GPUTimer;
  public static updateList?: Promise<{ path?: string; cpu: number; gpu: number; }>[];
  public static drawList?: Promise<{ path?: string; cpu: number; gpu: number; }>[];
  private static __updateHaveReachedBreakpoint = false;
  private static __drawHaveReachedBreakpoint = false;

  public static resetUpdateBreakpoint(): void {
    if ( process.env.DEV ) {
      const divComponentsUpdate = getDivComponentsUpdate();

      if ( Component.updateList != null ) {
        Promise.all( Component.updateList ).then( ( list ) => {
          let accumCpu = 0.0;
          let accumGpu = 0.0;

          const strEach = list.map( ( { path, cpu, gpu } ) => {
            accumCpu += cpu;
            accumGpu += gpu;
            return `${ cpu.toFixed( 3 ) }, ${ gpu.toFixed( 3 ) } - ${ path }`;
          } ).join( '\n' );

          const strAccum = `${ accumCpu.toFixed( 3 ) }, ${ accumGpu.toFixed( 3 ) } - UPDATE (${ COMPONENT_UPDATE_PATTERN })\n`;
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

          const strEach = list.map( ( { path, cpu, gpu } ) => {
            accumCpu += cpu;
            accumGpu += gpu;
            return `${ cpu.toFixed( 3 ) }, ${ gpu.toFixed( 3 ) } - ${ path }`;
          } ).join( '\n' );

          const strAccum = `${ accumCpu.toFixed( 3 ) }, ${ accumGpu.toFixed( 3 ) } - DRAW (${ COMPONENT_DRAW_PATTERN })\n`;
          divComponentsDraw.innerHTML = strAccum + strEach;
        } );
      }
      Component.drawList = [];

      this.__drawHaveReachedBreakpoint = false;
    }
  }

  public lastUpdateFrame = 0;

  public active: boolean;
  public visible: boolean;

  public name?: string;

  public ignoreBreakpoints?: boolean;

  public constructor( options?: ComponentOptions ) {
    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    if ( process.env.DEV ) {
      this.name = options?.name ?? ( this as any ).constructor.name;
      this.ignoreBreakpoints = options?.ignoreBreakpoints;

      Component.gpuTimer = new GPUTimer();
    }
  }

  public update( event: ComponentUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    if ( process.env.DEV ) {
      if ( Component.__updateHaveReachedBreakpoint && !this.ignoreBreakpoints ) {
        return;
      }
    }

    if ( process.env.DEV ) {
      let cpu: number;

      const path = `${ event.path }/${ this.name }`;

      if ( COMPONENT_UPDATE_PATTERN.exec( path ) ) {
        Component.updateList?.push(
          Component.gpuTimer!.measure( () => {
            const begin = performance.now();
            this.__updateImpl( event );
            cpu = ( performance.now() - begin ) * 0.001;
          } ).then( ( gpu ) => ( { path, cpu, gpu } ) )
        );
      } else {
        this.__updateImpl( event );
      }
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

      const path = `${ event.path }/${ this.name }`;

      if ( COMPONENT_DRAW_PATTERN.exec( path ) ) {
        Component.drawList?.push(
          Component.gpuTimer!.measure( () => {
            const begin = performance.now();
            this.__drawImpl( event );
            cpu = ( performance.now() - begin ) * 0.001;
          } ).then( ( gpu ) => ( { path, cpu, gpu } ) )
        );
      } else {
        this.__drawImpl( event );
      }
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
  if ( module.hot ) {
    module.hot.accept( '../../config-hot', () => {
      // do nothing, just want to update breakpoints, and measures
    } );
  }
}
