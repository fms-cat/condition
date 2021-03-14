import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { RenderTarget } from '../RenderTarget';
import { gl } from '../canvas';
import { BufferRenderTarget } from '../BufferRenderTarget';

export interface BlitOptions extends ComponentOptions {
  src?: BufferRenderTarget;
  dst?: RenderTarget;
  srcRect?: [ number, number, number, number ];
  dstRect?: [ number, number, number, number ];
  attachment?: GLenum;
  mask?: GLenum;
  filter?: GLenum;
}

/**
 * Blit.
 */
export class Blit extends Component {
  public src?: BufferRenderTarget;
  public dst?: RenderTarget;
  public srcRect?: [ number, number, number, number ] | null;
  public dstRect?: [ number, number, number, number ] | null;
  public attachment?: GLenum;
  public mask: GLenum;
  public filter: GLenum;

  public constructor( options: BlitOptions ) {
    super( options );

    this.visible = false;

    this.src = options.src;
    this.dst = options.dst;
    this.srcRect = options.srcRect;
    this.dstRect = options.dstRect;
    this.attachment = options.attachment;
    this.mask = options.mask ?? gl.COLOR_BUFFER_BIT;
    this.filter = options.filter ?? gl.NEAREST;
  }

  protected __updateImpl(): void {
    if ( this.src && this.dst ) {
      gl.bindFramebuffer( gl.READ_FRAMEBUFFER, this.src.framebuffer.raw );
      if ( this.dst instanceof BufferRenderTarget ) {
        gl.bindFramebuffer( gl.DRAW_FRAMEBUFFER, this.dst.framebuffer.raw );
      } else {
        gl.bindFramebuffer( gl.DRAW_FRAMEBUFFER, null );
      }

      gl.readBuffer( this.attachment ?? gl.COLOR_ATTACHMENT0 );
      gl.blitFramebuffer(
        ...( this.srcRect ?? [ 0, 0, this.src.width, this.src.height ] ),
        ...( this.dstRect ?? [ 0, 0, this.dst.width, this.dst.height ] ),
        this.mask,
        this.filter,
      );
    }
  }
}
