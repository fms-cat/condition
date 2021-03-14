import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { glCat } from '../canvas';

export interface CameraOptions extends ComponentOptions {
  renderTarget?: RenderTarget;
  projectionMatrix: Matrix4;
  scene?: Entity;
  clear?: Array<number | undefined> | false;
}

export abstract class Camera extends Component {
  protected __projectionMatrix: Matrix4;

  public get projectionMatrix(): Matrix4 {
    return this.__projectionMatrix;
  }

  public renderTarget?: RenderTarget;

  public scene?: Entity;

  public clear: Array<number | undefined> | false = [];

  public abstract get near(): number;

  public abstract get far(): number;

  public constructor( options: CameraOptions ) {
    super( options );

    this.visible = false;

    this.renderTarget = options.renderTarget;
    this.scene = options.scene;
    this.__projectionMatrix = options.projectionMatrix;
    if ( options.clear !== undefined ) { this.clear = options.clear; }
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    const { renderTarget, scene } = this;

    if ( !renderTarget ) {
      throw new Error( process.env.DEV && 'You must assign a renderTarget to the Camera' );
    }

    if ( !scene ) {
      throw new Error( process.env.DEV && 'You must assign a scene to the Camera' );
    }

    const viewMatrix = event.globalTransform.matrix.inverse!;

    renderTarget.bind();

    if ( this.clear ) {
      glCat.clear( ...this.clear );
    }

    scene.draw( {
      frameCount: event.frameCount,
      time: event.time,
      renderTarget: renderTarget,
      globalTransform: new Transform(),
      viewMatrix,
      projectionMatrix: this.__projectionMatrix,
      camera: this
    } );

    if ( process.env.DEV ) {
      Component.resetDrawBreakpoint();
    }
  }
}
