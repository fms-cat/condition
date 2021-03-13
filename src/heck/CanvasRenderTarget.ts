import { DISPLAY } from './DISPLAY';
import { RenderTarget } from './RenderTarget';

export class CanvasRenderTarget extends RenderTarget {
  public get width(): number {
    return DISPLAY.canvas.width;
  }

  public get height(): number {
    return DISPLAY.canvas.height;
  }

  public bind(): void {
    const { gl, glCat } = DISPLAY;
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    glCat.drawBuffers( [ gl.BACK ] );
    gl.viewport( 0, 0, this.width, this.height );
  }
}
