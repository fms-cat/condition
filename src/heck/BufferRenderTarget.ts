import { GLCatFramebuffer, GLCatTexture } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';
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

  private __name?: string;
  public get name(): string | undefined {
    return this.__name;
  }
  public set name( name: string | undefined ) {
    if ( process.env.DEV ) {
      // remove previous one from the nameMap
      if ( this.__name != null ) {
        BufferRenderTarget.nameMap.delete( this.__name );
      }

      this.__name = name;

      // set the current one to the nameMap
      if ( name != null ) {
        if ( BufferRenderTarget.nameMap.has( name ) ) {
          console.warn( `Duplicated BufferRenderTarget name, ${ name }` );
          return;
        }

        BufferRenderTarget.nameMap.set( name, this );
      } else {
        console.warn( 'BufferRenderTarget without name' );
      }
    }
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
      this.name = options?.name;
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
