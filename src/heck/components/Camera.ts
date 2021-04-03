import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Entity } from '../Entity';
import { MaterialTag } from '../Material';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { glCat } from '../../globals/canvas';

export interface CameraOptions extends ComponentOptions {
  renderTarget?: RenderTarget;
  projectionMatrix: Matrix4;
  materialTag: MaterialTag;
  scenes?: Entity[];
  clear?: Array<number | undefined> | false;
}

export abstract class Camera extends Component {
  public projectionMatrix: Matrix4;

  public renderTarget?: RenderTarget;

  public scenes?: Entity[];

  public clear: Array<number | undefined> | false = [];

  public materialTag: MaterialTag;

  public abstract get near(): number;

  public abstract get far(): number;

  public constructor( options: CameraOptions ) {
    super( options );

    this.visible = false;

    this.renderTarget = options.renderTarget;
    this.scenes = options.scenes;
    this.projectionMatrix = options.projectionMatrix;
    this.materialTag = options.materialTag;
    if ( options.clear !== undefined ) { this.clear = options.clear; }
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    const { renderTarget, scenes } = this;

    if ( !renderTarget ) {
      throw process.env.DEV && new Error( 'You must assign a renderTarget to the Camera' );
    }

    if ( !scenes ) {
      throw process.env.DEV && new Error( 'You must assign scenes to the Camera' );
    }

    const viewMatrix = event.globalTransform.matrix.inverse!;

    renderTarget.bind();

    if ( this.clear ) {
      glCat.clear( ...this.clear );
    }

    scenes.map( ( scene ) => {
      scene.draw( {
        frameCount: event.frameCount,
        time: event.time,
        renderTarget: renderTarget,
        cameraTransform: event.globalTransform,
        globalTransform: new Transform(),
        viewMatrix,
        projectionMatrix: this.projectionMatrix,
        camera: this,
        materialTag: this.materialTag,
        path: process.env.DEV && `(${ this.materialTag }) `,
      } );
    } );
  }
}
