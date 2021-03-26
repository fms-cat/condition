import { CUBEMAP_RESOLUTION } from '../config';
import { CubemapCamera } from '../heck/components/CubemapCamera';
import { CubemapRenderTarget } from '../heck/CubemapRenderTarget';
import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';

export interface CubemapCameraEntityOptions {
  root: Entity;
  lights: LightEntity[];
}

export class CubemapCameraEntity extends Entity {
  public root: Entity;
  public camera: PerspectiveCamera;
  public readonly target: CubemapRenderTarget;

  public constructor( options: CubemapCameraEntityOptions ) {
    super();

    this.root = options.root;

    this.target = new CubemapRenderTarget( {
      width: CUBEMAP_RESOLUTION[ 0 ],
      height: CUBEMAP_RESOLUTION[ 1 ],
    } );

    this.camera = new CubemapCamera( {
      scene: this.root,
      renderTarget: this.target,
      near: 1.0,
      far: 20.0,
      name: 'CubemapCameraEntity/camera',
      materialTag: 'forward',
    } );
    this.components.push( this.camera );
  }
}
