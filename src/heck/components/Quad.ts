import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Material } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { gl, glCat } from '../../globals/canvas';
import { quadGeometry } from '../../globals/quadGeometry';

export interface QuadOptions extends ComponentOptions {
  material: Material;
  target: RenderTarget;
  range?: [ number, number, number, number ];
  clear?: Array<number | undefined> | false;
}

/**
 * Renders a fullscreen quad.
 */
export class Quad extends Component {
  public material: Material;
  public target: RenderTarget;
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

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    glCat.useProgram( this.material.program );

    this.target.bind();
    this.material.setBlendMode();

    gl.enable( gl.DEPTH_TEST );
    gl.depthMask( true );

    if ( this.clear ) {
      glCat.clear( ...this.clear );
    }

    this.material.setUniforms();

    const program = this.material.program;

    program.uniform( 'time', '1f', event.time );
    program.uniform( 'deltaTime', '1f', event.deltaTime );
    program.uniform( 'frameCount', '1f', event.frameCount );
    program.uniform( 'resolution', '2f', this.target.width, this.target.height );
    program.uniform( 'range', '4f', ...this.range );

    quadGeometry.draw();
  }
}
