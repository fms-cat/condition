import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { CubemapRenderTarget } from '../heck/CubemapRenderTarget';
import { CubemapCamera } from '../heck/components/CubemapCamera';
import { CUBEMAP_RESOLUTION } from '../config';

export interface CubemapCameraEntityOptions {
  root: Entity;
  lights: LightEntity[];
}

export class CubemapCameraEntity {
  public root: Entity;
  public camera: PerspectiveCamera;
  public readonly target: CubemapRenderTarget;
  public entity: Entity;

  public constructor( options: CubemapCameraEntityOptions ) {
    this.root = options.root;

    this.entity = new Entity();

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
    this.entity.components.push( this.camera );
  }
}
