import { GLCatFramebuffer, GLCatTextureCubemap } from '@fms-cat/glcat-ts';
import { RenderTarget } from './RenderTarget';
import { gl, glCat } from '../globals/canvas';

export interface CubemapRenderTargetOptions {
  width: number;
  height: number;
  isFloat?: boolean;
}

export class CubemapRenderTarget extends RenderTarget {
  public readonly framebuffer: GLCatFramebuffer;
  public readonly texture: GLCatTextureCubemap;
  public readonly width: number;
  public readonly height: number;

  public constructor( options: CubemapRenderTargetOptions ) {
    super();

    const { framebuffer, texture } = glCat.lazyCubemapFramebuffer(
      options.width,
      options.height,
      {
        isFloat: options.isFloat ?? true
      },
    );
    this.framebuffer = framebuffer;
    this.texture = texture;

    this.width = options.width;
    this.height = options.height;
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer.raw );
    glCat.drawBuffers( 1 );
    gl.viewport( 0, 0, this.width, this.height );
  }

  public dispose(): void {
    this.framebuffer.dispose();
  }
}
