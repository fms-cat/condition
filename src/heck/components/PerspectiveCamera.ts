import { Camera } from './Camera';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { ComponentOptions } from './Component';
import { MaterialTag } from '../Material';

export interface PerspectiveCameraOptions extends ComponentOptions {
  materialTag: MaterialTag;
  renderTarget?: RenderTarget;
  near?: number;
  far?: number;
  fov?: number;
  scene?: Entity;
  clear?: Array<number | undefined> | false;
}

export class PerspectiveCamera extends Camera {
  public readonly near: number;
  public readonly far: number;

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
      clear: options.clear,
    } );

    this.near = options.near || 0.01;
    this.far = options.far || 100.0;
  }
}
