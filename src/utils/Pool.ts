export class Pool<T> {
  public array: T[];

  private __index = 0;

  public get current(): T {
    return this.array[ this.__index ];
  }

  public constructor( array: T[] ) {
    this.array = array;
  }

  public next(): T {
    this.__index = ( this.__index + 1 ) % this.array.length;
    return this.current;
  }
}
