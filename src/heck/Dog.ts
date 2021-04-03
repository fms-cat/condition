import { Component } from './components/Component';
import { Entity } from './Entity';
import { Transform } from './Transform';
import { music } from '../globals/music';

/**
 * And what a WONDERFUL Dog they are!!
 */
export class Dog {
  public root: Entity;
  public active: boolean;

  private __frameCount: number = 0;

  public constructor() {
    this.root = new Entity();
    this.active = true;

    if ( process.env.DEV ) {
      this.root.name = 'root';
    }

    const update = (): void => {
      if ( this.active ) {
        music.update();
        this.root.update( {
          frameCount: this.__frameCount ++,
          time: music.time,
          deltaTime: music.deltaTime,
          globalTransform: new Transform(),
          parent: null,
          path: process.env.DEV && '',
        } );
      }

      if ( process.env.DEV ) {
        Component.resetUpdateBreakpoint();
        Component.resetDrawBreakpoint();
      }

      requestAnimationFrame( update );
    };
    update();
  }
}
