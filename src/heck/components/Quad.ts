import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Material } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { gl, glCat } from '../../globals/canvas';
import { quadGeometry } from '../../globals/quadGeometry';

export interface QuadOptions extends ComponentOptions {
  material?: Material;
  target?: RenderTarget;
  range?: [ number, number, number, number ];
  clear?: Array<number | undefined> | false;
}

/**
 * Renders a fullscreen quad.
 */
export class Quad extends Component {
  public material?: Material;
  public target?: RenderTarget;
  public range: [ number, number, number, number ] = [ -1.0, -1.0, 1.0, 1.0 ];
  public clear: Array<number | undefined> | false = false;

  public constructor( options: QuadOptions ) {
    super( options );

    this.visible = false;

    this.material = options.material;
    this.target = options.target;
    if ( options.range !== undefined ) { this.range = options.range; }
    if ( options.clear !== undefined ) { this.clear = options.clear; }
  }

  public drawImmediate( event?: Partial<ComponentUpdateEvent> ): void {
    const { target, material } = this;

    if ( target == null || material == null ) {
      throw process.env.DEV && new Error( 'Quad: You must assign target and material before draw' );
    }

    glCat.useProgram( material.program );

    target.bind();
    material.setBlendMode();

    gl.enable( gl.DEPTH_TEST );
    gl.depthMask( true );

    if ( this.clear ) {
      glCat.clear( ...this.clear );
    }

    material.setUniforms();

    const program = material.program;

    program.uniform( 'time', '1f', event?.time ?? 0.0 );
    program.uniform( 'deltaTime', '1f', event?.deltaTime ?? 0.0 );
    program.uniform( 'frameCount', '1f', event?.frameCount ?? 0 );
    program.uniform( 'resolution', '2f', target.width, target.height );
    program.uniform( 'range', '4f', ...this.range );

    quadGeometry.draw();
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.drawImmediate( event );
  }
}
