import { GLCatFramebuffer, GLCatTexture } from '@fms-cat/glcat-ts';
import { RenderTarget } from './RenderTarget';
import { gl, glCat } from '../globals/canvas';

export interface BufferRenderTargetOptions {
  width: number;
  height: number;
  numBuffers?: number;
  isFloat?: boolean;
  name?: string;
}

export class BufferRenderTarget extends RenderTarget {
  public static nameMap = new Map<string, BufferRenderTarget>();

  public readonly framebuffer: GLCatFramebuffer;
  public readonly width: number;
  public readonly height: number;
  public readonly numBuffers: number;

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

    this.framebuffer = glCat.lazyDrawbuffers(
      options.width,
      options.height,
      options.numBuffers ?? 1,
      {
        isFloat: options.isFloat ?? true
      }
    );

    this.width = options.width;
    this.height = options.height;
    this.numBuffers = options.numBuffers ?? 1;

    if ( process.env.DEV ) {
      this.name = options?.name;
    }
  }

  public get texture(): GLCatTexture {
    return this.framebuffer.texture!;
  }

  public getTexture( attachment: number ): GLCatTexture | null {
    return this.framebuffer.getTexture( attachment );
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer.raw );
    glCat.drawBuffers( this.numBuffers );
    gl.viewport( 0, 0, this.width, this.height );
  }

  public dispose(): void {
    this.framebuffer.dispose();
  }
}
