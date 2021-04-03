import { Camera } from './components/Camera';
import { Component } from './components/Component';
import { MaterialTag } from './Material';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from './RenderTarget';
import { Transform } from './Transform';

export interface EntityUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  parent: Entity | null;
  path?: string;
}

export interface EntityDrawEvent {
  frameCount: number;
  time: number;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  path?: string;
}

export interface EntityOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
}

export class Entity {
  public readonly transform = new Transform();
  public globalTransformCache = new Transform();

  public lastUpdateFrame = 0;

  public active = true;
  public visible = true;

  public name?: string;

  public children: Entity[] = [];
  public components: Component[] = [];

  public constructor( options?: EntityOptions ) {
    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    if ( process.env.DEV ) {
      this.name = options?.name ?? ( this as any ).constructor.name;
    }
  }

  public update( event: EntityUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    const globalTransform = event.globalTransform.multiply( this.transform );

    let path: string;
    if ( process.env.DEV ) {
      path = `${ event.path }/${ this.name }`;
    }

    this.components.forEach( ( component ) => {
      component.update( {
        frameCount: event.frameCount,
        time: event.time,
        deltaTime: event.deltaTime,
        globalTransform,
        entity: this,
        path,
      } );
    } );

    this.children.forEach( ( child ) => {
      child.update( {
        frameCount: event.frameCount,
        time: event.time,
        deltaTime: event.deltaTime,
        globalTransform,
        parent: this,
        path,
      } );
    } );
  }

  public draw( event: EntityDrawEvent ): void {
    if ( !this.visible ) { return; }

    this.globalTransformCache = event.globalTransform.multiply( this.transform );

    let path: string;
    if ( process.env.DEV ) {
      path = `${ event.path }/${ this.name }`;
    }

    this.components.forEach( ( component ) => {
      component.draw( {
        frameCount: event.frameCount,
        time: event.time,
        renderTarget: event.renderTarget,
        globalTransform: this.globalTransformCache,
        camera: event.camera,
        cameraTransform: event.cameraTransform,
        viewMatrix: event.viewMatrix,
        projectionMatrix: event.projectionMatrix,
        entity: this,
        materialTag: event.materialTag,
        path,
      } );
    } );

    this.children.forEach( ( child ) => {
      child.draw( {
        frameCount: event.frameCount,
        time: event.time,
        renderTarget: event.renderTarget,
        globalTransform: this.globalTransformCache,
        viewMatrix: event.viewMatrix,
        projectionMatrix: event.projectionMatrix,
        camera: event.camera,
        cameraTransform: event.cameraTransform,
        materialTag: event.materialTag,
        path,
      } );
    } );
  }
}
