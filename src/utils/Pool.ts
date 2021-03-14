export class Pool<T> {
  public array: T[];

  public index = 0;

  public get current(): T {
    return this.array[ this.index ];
  }

  public constructor( array: T[] ) {
    this.array = array;
  }

  public next(): T {
    this.index = ( this.index + 1 ) % this.array.length;
    return this.current;
  }
}
