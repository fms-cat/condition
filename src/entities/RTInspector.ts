import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RTINSPECTOR_CAPTURE_INDEX, RTINSPECTOR_CAPTURE_NAME, RTINSPECTOR_MULTIPLE } from '../config-hot';
import { RenderTarget } from '../heck/RenderTarget';
import { canvas, gl } from '../globals/canvas';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import inspectorFrag from '../shaders/inspector.frag';
import quadVert from '../shaders/quad.vert';

export interface RTInspectorOptions {
  target: RenderTarget;
}

export class RTInspector extends Entity {
  public entitySingle: Entity;
  public entityMultiple: Entity;
  public materialSingle: Material;
  public quadSingle: Quad;
  public blitsMultiple: Blit[];

  public constructor( options: RTInspectorOptions ) {
    super();

    // -- single -----------------------------------------------------------------------------------
    this.entitySingle = new Entity();
    this.children.push( this.entitySingle );

    this.materialSingle = new Material(
      quadVert,
      inspectorFrag,
      { initOptions: { target: dummyRenderTarget, geometry: quadGeometry } },
    );

    this.quadSingle = new Quad( {
      target: options.target,
      material: this.materialSingle,
      name: 'RTInspector/quadSingle',
      ignoreBreakpoints: true,
    } );
    this.entitySingle.components.push( this.quadSingle );

    // -- mouse listener ---------------------------------------------------------------------------
    canvas.addEventListener( 'mousemove', ( { offsetX, offsetY } ) => {
      const rect = canvas.getBoundingClientRect();
      const x = offsetX / rect.width;
      const y = 1.0 - offsetY / rect.height;

      this.materialSingle.addUniform( 'mouse', '2f', x, y );
    } );

    // -- multiple ---------------------------------------------------------------------------------
    this.entityMultiple = new Entity();
    this.children.push( this.entityMultiple );

    // count first?
    let count = 0;
    for ( const src of BufferRenderTarget.nameMap.values() ) {
      count += src.numBuffers;
    }

    // grid
    const grid = Math.ceil( Math.sqrt( count ) );
    const width = Math.floor( options.target.width / grid );
    const height = Math.floor( options.target.height / grid );

    // then add blits
    let iBlit = 0;
    this.blitsMultiple = [];
    for ( const src of BufferRenderTarget.nameMap.values() ) {
      for ( let iAttachment = 0; iAttachment < src.numBuffers; iAttachment ++ ) {
        const x = iBlit % grid;
        const y = grid - 1 - Math.floor( iBlit / grid );
        const dstRect: [ number, number, number, number ] = [
          width * x,
          height * y,
          width * ( x + 1.0 ),
          height * ( y + 1.0 ),
        ];

        const blit = new Blit( {
          src,
          dst: options.target,
          attachment: gl.COLOR_ATTACHMENT0 + iAttachment,
          dstRect,
          name: `RTInspector/blitsMultiple/${ src.name }/${ iAttachment }`,
          ignoreBreakpoints: true,
        } );

        this.blitsMultiple.push( blit );
        this.entityMultiple.components.push( blit );

        iBlit ++;
      }
    }

    // -- see the config ---------------------------------------------------------------------------
    this.__updateTarget();

    // -- hot hot hot hot hot ----------------------------------------------------------------------
    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../config-hot', () => {
          this.__updateTarget();
        } );
      }
    }
  }

  private __updateTarget(): void {
    if ( RTINSPECTOR_MULTIPLE ) {
      this.entityMultiple.active = true;
      this.entitySingle.active = false;
    } else if ( RTINSPECTOR_CAPTURE_NAME != null ) {
      this.entityMultiple.active = false;

      const target = BufferRenderTarget.nameMap.get( RTINSPECTOR_CAPTURE_NAME ?? '' ) ?? null;
      const attachment = gl.COLOR_ATTACHMENT0 + ( RTINSPECTOR_CAPTURE_INDEX ?? 0 );

      if ( !target ) {
        if ( process.env.DEV ) {
          console.warn( `RTInspector: Cannot retrieve a render target texture, RTINSPECTOR_CAPTURE_NAME: ${ RTINSPECTOR_CAPTURE_NAME }, RTINSPECTOR_CAPTURE_INDEX: ${ RTINSPECTOR_CAPTURE_INDEX }` );
        }

        this.entitySingle.active = false;
        return;
      }

      const texture = target.getTexture( attachment );
      this.materialSingle.addUniformTexture( 'sampler0', texture );

      this.entitySingle.active = true;
    } else {
      // fallback to not render it
      this.entityMultiple.active = false;
      this.entitySingle.active = false;
    }
  }
}
