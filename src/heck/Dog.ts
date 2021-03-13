import { Entity } from './Entity';
import { Transform } from './Transform';
import { Music } from '../Music';
import { Component } from './components/Component';

let ha = 0;

/**
 * And what a WONDERFUL Dog they are!!
 */
export class Dog {
  public root: Entity;
  public music: Music;
  public active: boolean;

  private __frameCount: number = 0;

  public constructor( music: Music ) {
    this.root = new Entity();
    this.music = music;
    this.active = true;

    const update = (): void => {
      if ( this.active ) {
        this.music.update();
        this.root.update( {
          frameCount: this.__frameCount ++,
          time: this.music.time,
          deltaTime: this.music.deltaTime,
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
