import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Geometry } from '../Geometry';
import { Material } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { glCat } from '../../globals/canvas';

const quadBuffer = glCat.createBuffer();
quadBuffer.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

const quadGeometry = new Geometry();
quadGeometry.addAttribute( 'p', {
  buffer: quadBuffer,
  size: 2,
  type: /* GL_FLOAT */ 5126
} );

quadGeometry.count = 4;
quadGeometry.mode = /* GL_TRIANGLE_STRIP */ 5;

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

    if ( this.clear ) {
      glCat.clear( ...this.clear );
    }

    quadGeometry.assignBuffers( this.material );

    this.material.setUniforms();

    const program = this.material.program;

    program.uniform1f( 'time', event.time );
    program.uniform1f( 'deltaTime', event.deltaTime );
    program.uniform1f( 'frameCount', event.frameCount );
    program.uniform2f( 'resolution', this.target.width, this.target.height );
    program.uniform4f( 'range', ...this.range );

    quadGeometry.draw();
  }
}
