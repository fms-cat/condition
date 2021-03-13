import { GLCatBuffer, GLCatTransformFeedback } from '@fms-cat/glcat-ts';
import { DISPLAY } from './DISPLAY';
import { Material } from './Material';

export interface GeometryAttribute {
  buffer: GLCatBuffer<WebGL2RenderingContext>;
  size: number;
  divisor?: number;
  type: GLenum;
  stride?: number;
  offset?: number;
}

export interface GeometryIndex {
  buffer: GLCatBuffer<WebGL2RenderingContext>;
  type: GLenum;
}

export class Geometry {
  public static typeSizeMap = {
    [ DISPLAY.gl.BYTE ]: 1,
    [ DISPLAY.gl.UNSIGNED_BYTE ]: 1,
    [ DISPLAY.gl.SHORT ]: 2,
    [ DISPLAY.gl.UNSIGNED_SHORT ]: 2,
    [ DISPLAY.gl.INT ]: 4,
    [ DISPLAY.gl.UNSIGNED_INT ]: 4,
    [ DISPLAY.gl.HALF_FLOAT ]: 2,
    [ DISPLAY.gl.FLOAT ]: 4,
  };

  public transformFeedback?: GLCatTransformFeedback<WebGL2RenderingContext> | null;

  protected __attributes: {
    [ name: string ]: GeometryAttribute;
  } = {};
  protected __index: GeometryIndex | null = null;

  public mode: GLenum = /* GL_TRIANGLES */ 4;
  public first = 0;
  public count = 0;
  public primcount: number | null = null;

  public addAttribute( name: string, attribute: GeometryAttribute ): void {
    this.__attributes[ name ] = attribute;
  }

  public removeAttribute( name: string, alsoDisposeBuffer = true ): void {
    if ( alsoDisposeBuffer ) {
      this.__attributes[ name ].buffer.dispose();
    }

    delete this.__attributes[ name ];
  }

  public setIndex( index: GeometryIndex | null ): void {
    this.__index = index;
  }

  public assignBuffers( material: Material ): void {
    const program = material.program;

    Object.entries( this.__attributes ).forEach( ( [ name, attr ] ) => {
      program.attribute(
        name,
        attr.buffer,
        attr.size,
        attr.divisor,
        attr.type,
        attr.stride,
        attr.offset
      );
    } );
  }

  public draw(): void {
    const { gl, glCat } = DISPLAY;

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
    const { gl, glCat } = DISPLAY;

    if ( this.__index ) {
      glCat.bindIndexBuffer( this.__index.buffer, () => {
        gl.drawElements(
          this.mode,
          this.count,
          this.__index!.type,
          this.first * Geometry.typeSizeMap[ this.__index!.type ]
        );
      } );
    } else {
      gl.drawArrays( this.mode, this.first, this.count );
    }
  }

  public disposeBuffers(): void {
    Object.values( this.__attributes ).forEach( ( attr ) => {
      attr.buffer.dispose();
    } );
  }
}
