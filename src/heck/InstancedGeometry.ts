import { gl } from '../globals/canvas';
import { Geometry } from './Geometry';

export class InstancedGeometry extends Geometry {
  public primcount: number = 0;

  public draw(): void {
    if ( process.env.DEV ) {
      if ( this.count === 0 ) {
        console.warn( 'You attempt to draw an instanced geometry that count is 0' );
        return;
      }

      if ( this.primcount === 0 ) {
        console.warn( 'You attempt to draw an instanced geometry that primcount is 0' );
        return;
      }
    }

    if ( this.__index ) {
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.__index.buffer.raw );
      gl.drawElementsInstanced(
        this.mode,
        this.count,
        this.__index.type,
        this.first * InstancedGeometry.typeSizeMap[ this.__index.type ],
        this.primcount
      );
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    } else {
      gl.drawArraysInstanced( this.mode, this.first, this.count, this.primcount );
    }
  }
}
