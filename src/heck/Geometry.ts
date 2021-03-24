import { GLCatTransformFeedback, GLCatVertexArray } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

export class Geometry {
  public static typeSizeMap = {
    [ gl.BYTE ]: 1,
    [ gl.UNSIGNED_BYTE ]: 1,
    [ gl.SHORT ]: 2,
    [ gl.UNSIGNED_SHORT ]: 2,
    [ gl.INT ]: 4,
    [ gl.UNSIGNED_INT ]: 4,
    [ gl.HALF_FLOAT ]: 2,
    [ gl.FLOAT ]: 4,
  };

  public transformFeedback?: GLCatTransformFeedback | null;

  public mode: GLenum = gl.TRIANGLES;
  public first = 0;
  public count = 0;
  public indexType: GLenum | null = null; // null to not use index buffer

  public vao: GLCatVertexArray;

  public constructor() {
    this.vao = glCat.createVertexArray();
  }

  public draw(): void {
    if ( process.env.DEV ) {
      if ( this.count === 0 ) {
        console.warn( 'You attempt to draw a geometry that count is 0' );
        return;
      }
    }

    if ( this.transformFeedback ) {
      glCat.bindTransformFeedback( this.transformFeedback, () => {
        gl.beginTransformFeedback( this.mode );
        this.drawElementsOrArrays();
        gl.endTransformFeedback();
      } );
    } else {
      this.drawElementsOrArrays();
    }
  }

  public drawElementsOrArrays(): void {
    glCat.bindVertexArray( this.vao, () => {
      if ( this.indexType != null ) {
        gl.drawElements(
          this.mode,
          this.count,
          this.indexType!,
          this.first * Geometry.typeSizeMap[ this.indexType! ],
        );
      } else {
        gl.drawArrays( this.mode, this.first, this.count );
      }
    } );
  }

  public disposeBuffers(): void {
    if ( process.env.DEV ) {
      throw new Error( 'Not Implemented' );
    }
  }
}
