import { GLCatFramebuffer, GLCatTexture } from '@fms-cat/glcat-ts';
import { gl, glCat } from './canvas';
import { RenderTarget } from './RenderTarget';

export interface BufferRenderTargetOptions {
  width: number;
  height: number;
  numBuffers?: number;
  isFloat?: boolean;
  name?: string;
}

export class BufferRenderTarget extends RenderTarget {
  public static nameMap = new Map<string, BufferRenderTarget>();

  private readonly __framebuffer: GLCatFramebuffer<WebGL2RenderingContext>;

  public get framebuffer(): GLCatFramebuffer<WebGL2RenderingContext> {
    return this.__framebuffer;
  }

  private __width: number;

  public get width(): number {
    return this.__width;
  }

  private __height: number;

  public get height(): number {
    return this.__height;
  }

  private __numBuffers: number;

  public get numBuffers(): number {
    return this.__numBuffers;
  }

  public constructor( options: BufferRenderTargetOptions ) {
    super();

    this.__framebuffer = glCat.lazyDrawbuffers(
      options.width,
      options.height,
      options.numBuffers || 1,
      {
        isFloat: options.isFloat || true
      }
    );

    this.__width = options.width;
    this.__height = options.height;
    this.__numBuffers = options.numBuffers || 1;

    if ( process.env.DEV ) {
      if ( options.name ) {
        if ( BufferRenderTarget.nameMap.has( options.name ) ) {
          console.warn( `Duplicated BufferRenderTarget name, ${ options.name }` );
          return;
        }

        BufferRenderTarget.nameMap.set( options.name, this );
      } else {
        console.warn( 'BufferRenderTarget created without name' );
      }
    }
  }

  public get texture(): GLCatTexture<WebGL2RenderingContext> {
    return this.__framebuffer.texture!;
  }

  public getTexture( attachment: number ): GLCatTexture<WebGL2RenderingContext> | null {
    return this.__framebuffer.getTexture( attachment );
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.__framebuffer.raw );
    glCat.drawBuffers( this.__numBuffers );
    gl.viewport( 0, 0, this.width, this.height );
  }

  public dispose(): void {
    this.__framebuffer.dispose();
  }
}
