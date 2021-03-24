import { Camera } from './components/Camera';
import { Component } from './components/Component';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from './RenderTarget';
import { Transform } from './Transform';
import { MaterialTag } from './Material';

export interface EntityUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  parent: Entity | null;
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
}

export class Entity {
  public readonly transform = new Transform();

  public lastUpdateFrame = 0;

  public active = true;
  public visible = true;

  public children: Entity[] = [];
  public components: Component[] = [];

  public update( event: EntityUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    const globalTransform = event.globalTransform.multiply( this.transform );

    this.components.forEach( ( component ) => {
      component.update( {
        frameCount: event.frameCount,
        time: event.time,
        deltaTime: event.deltaTime,
        globalTransform,
        entity: this
      } );
    } );

    this.children.forEach( ( child ) => {
      child.update( {
        frameCount: event.frameCount,
        time: event.time,
        deltaTime: event.deltaTime,
        globalTransform,
        parent: this
      } );
    } );
  }

  public draw( event: EntityDrawEvent ): void {
    if ( !this.visible ) { return; }

    const globalTransform = event.globalTransform.multiply( this.transform );

    this.components.forEach( ( component ) => {
      component.draw( {
        frameCount: event.frameCount,
        time: event.time,
        renderTarget: event.renderTarget,
        globalTransform,
        camera: event.camera,
        cameraTransform: event.cameraTransform,
        viewMatrix: event.viewMatrix,
        projectionMatrix: event.projectionMatrix,
        entity: this,
        materialTag: event.materialTag,
      } );
    } );

    this.children.forEach( ( child ) => {
      child.draw( {
        frameCount: event.frameCount,
        time: event.time,
        renderTarget: event.renderTarget,
        globalTransform,
        viewMatrix: event.viewMatrix,
        projectionMatrix: event.projectionMatrix,
        camera: event.camera,
        cameraTransform: event.cameraTransform,
        materialTag: event.materialTag,
      } );
    } );
  }
}
