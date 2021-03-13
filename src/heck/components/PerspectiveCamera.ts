import { Camera } from './Camera';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { ComponentOptions } from './Component';

export interface PerspectiveCameraOptions extends ComponentOptions {
  renderTarget?: RenderTarget;
  near?: number;
  far?: number;
  fov?: number;
  scene?: Entity;
  clear?: Array<number | undefined> | false;
}

export class PerspectiveCamera extends Camera {
  private __near: number;

  public get near(): number {
    return this.__near;
  }

  private __far: number;

  public get far(): number {
    return this.__far;
  }

  public constructor( options: PerspectiveCameraOptions ) {
    const projectionMatrix = Matrix4.perspective(
      options.fov || 45.0,
      options.near || 0.01,
      options.far || 100.0,
    );

    super( {
      ...options,
      projectionMatrix,
      renderTarget: options.renderTarget,
      scene: options.scene,
      clear: options.clear
    } );

    this.__near = options.near || 0.01;
    this.__far = options.far || 100.0;
  }
}
