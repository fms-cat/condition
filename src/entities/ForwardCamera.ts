import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { RenderTarget } from '../heck/RenderTarget';

export interface ForwardCameraOptions {
  scenes: Entity[];
  target: RenderTarget;
  lights: LightEntity[];
}

export class ForwardCamera extends Entity {
  public camera: PerspectiveCamera;

  public constructor( options: ForwardCameraOptions ) {
    super();

    this.camera = new PerspectiveCamera( {
      scenes: options.scenes,
      renderTarget: options.target,
      near: 0.1,
      far: 20.0,
      name: process.env.DEV && 'camera',
      materialTag: 'forward',
    } );
    this.camera.clear = false;

    this.components.push( this.camera );
  }
}
