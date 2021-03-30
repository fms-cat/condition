import { Camera } from './Camera';
import { ComponentOptions } from './Component';
import { Entity } from '../Entity';
import { MaterialTag } from '../Material';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';

export interface PerspectiveCameraOptions extends ComponentOptions {
  materialTag: MaterialTag;
  renderTarget?: RenderTarget;
  near?: number;
  far?: number;
  fov?: number;
  scenes?: Entity[];
  clear?: Array<number | undefined> | false;
}

export class PerspectiveCamera extends Camera {
  public get fov(): number {
    return this.__fov;
  }
  public set fov( value: number ) {
    this.__fov = value;
    this.__updatePerspectiveCamera();
  }
  private __fov: number;

  public get near(): number {
    return this.__near;
  }
  public set near( value: number ) {
    this.__near = value;
    this.__updatePerspectiveCamera();
  }
  private __near: number;

  public get far(): number {
    return this.__far;
  }
  public set far( value: number ) {
    this.__far = value;
    this.__updatePerspectiveCamera();
  }
  private __far: number;

  public constructor( options: PerspectiveCameraOptions ) {
    const fov = options.fov ?? 45.0;
    const near = options.near ?? 0.01;
    const far = options.far ?? 100.0;

    const projectionMatrix = Matrix4.perspective( fov, near, far );

    super( {
      ...options,
      projectionMatrix,
      renderTarget: options.renderTarget,
      scenes: options.scenes,
      clear: options.clear,
    } );

    this.__fov = fov;
    this.__near = near;
    this.__far = far;
  }

  protected __updatePerspectiveCamera(): void {
    this.projectionMatrix = Matrix4.perspective( this.fov, this.near, this.far );
  }
}
