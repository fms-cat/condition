import { Entity } from './Entity';
import { Transform } from './Transform';
import { Component } from './components/Component';
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

    const update = (): void => {
      if ( this.active ) {
        music.update();
        this.root.update( {
          frameCount: this.__frameCount ++,
          time: music.time,
          deltaTime: music.deltaTime,
          globalTransform: new Transform(),
          parent: null
        } );
      }

      if ( process.env.DEV ) {
        Component.resetUpdateBreakpoint();
      }

      requestAnimationFrame( update );
    };
    update();
  }
}
