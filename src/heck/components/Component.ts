import { Camera } from './Camera';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { COMPONENT_DRAW_BREAKPOINT, COMPONENT_UPDATE_BREAKPOINT } from '../../config-hot';

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
  public static nameMap = new Map<string, Component>();
  private static __updateHaveReachedBreakpoint = false;
  private static __drawHaveReachedBreakpoint = false;

  public static resetUpdateBreakpoint(): void {
    if ( process.env.DEV ) {
      if ( window.divComponentsUpdate ) {
        if ( window.divComponentsUpdate.innerHTML !== window.strComponentsUpdate ) {
          window.divComponentsUpdate.innerHTML = window.strComponentsUpdate ?? '';
        }
      }
      window.strComponentsUpdate = '== update ==';

      this.__updateHaveReachedBreakpoint = false;
    }
  }

  public static resetDrawBreakpoint(): void {
    if ( process.env.DEV ) {
      if ( window.divComponentsDraw ) {
        if ( window.divComponentsDraw.innerHTML !== window.strComponentsDraw ) {
          window.divComponentsDraw.innerHTML = window.strComponentsDraw ?? '';
        }
      }
      window.strComponentsDraw = '== draw ==';

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

      if ( !this.name ) {
        console.warn( 'Component created without name' );
      }
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

      if ( window.strComponentsUpdate != null ) {
        window.strComponentsUpdate += `\n${ this.name }`;
      }
    }

    this.__updateImpl( event );

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
      if ( window.strComponentsDraw != null ) {
        window.strComponentsDraw += `\n${ this.name }`;
      }

      if ( Component.__drawHaveReachedBreakpoint && !this.ignoreBreakpoints ) {
        return;
      }
    }

    this.__drawImpl( event );

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
