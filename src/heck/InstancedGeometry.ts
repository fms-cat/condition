import { gl, glCat } from '../globals/canvas';
import { Geometry } from './Geometry';

export class InstancedGeometry extends Geometry {
  public primcount: number = 0;

  public drawElementsOrArrays(): void {
    if ( this.primcount === 0 ) {
      console.warn( 'You attempt to draw an instanced geometry that primcount is 0' );
      return;
    }

    glCat.bindVertexArray( this.vao, () => {
      if ( this.indexType != null ) {
        gl.drawElementsInstanced(
          this.mode,
          this.count,
          this.indexType!,
          this.first * Geometry.typeSizeMap[ this.indexType! ],
          this.primcount,
        );
      } else {
        gl.drawArraysInstanced( this.mode, this.first, this.count, this.primcount );
      }
    } );
  }
}
