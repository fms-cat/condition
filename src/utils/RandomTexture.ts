import { GLCat, GLCatTexture } from '@fms-cat/glcat-ts';
import { Xorshift } from '@fms-cat/experimental';
import { DISPLAY } from '../heck/DISPLAY';

export class RandomTexture {
  private __texture: GLCatTexture<WebGL2RenderingContext>;
  private __array: Uint8Array;
  private __rng: Xorshift;
  private __width: number;
  private __height: number;

  public constructor(
    glCat: GLCat<WebGL2RenderingContext>,
    width: number,
    height: number,
  ) {
    this.__width = width;
    this.__height = height;
    this.__rng = new Xorshift();
    this.__array = new Uint8Array( width * height * 4 );
    this.__texture = glCat.createTexture()!;
    this.__texture.textureWrap( DISPLAY.gl.REPEAT );
  }

  public get texture(): GLCatTexture<WebGL2RenderingContext> {
    return this.__texture;
  }

  public dispose(): void {
    this.__texture.dispose();
  }

  public resize( width: number, height: number, seed?: number ): void {
    this.__width = width;
    this.__height = height;
    this.__array = new Uint8Array( width * height * 4 );

    this.update( seed );
  }

  public update( seed?: number ): void {
    if ( seed ) { this.__rng.seed = seed; }

    for ( let i = 0; i < this.__array.length; i ++ ) {
      this.__array[ i ] = Math.floor( this.__rng.gen() * 256.0 );
    }

    this.__texture.setTextureFromArray(
      this.__width,
      this.__height,
      this.__array
    );
  }
}
