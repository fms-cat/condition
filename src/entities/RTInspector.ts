import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import returnFrag from '../shaders/return.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { RTINSPECTOR_CAPTURE_INDEX, RTINSPECTOR_CAPTURE_NAME } from '../config-hot';
import { DISPLAY } from '../heck/DISPLAY';

export interface RTInspectorOptions {
  target: RenderTarget;
}

export class RTInspector {
  public entity: Entity;
  public material: Material;

  public constructor( options: RTInspectorOptions ) {
    this.entity = new Entity();

    this.material = new Material(
      quadVert,
      returnFrag,
    );

    this.entity.components.push( new Quad( {
      target: options.target,
      material: this.material,
      name: process.env.DEV && 'RTInspector/quad',
      ignoreBreakpoints: true,
    } ) );

    this.__updateTarget();

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../config-hot', () => {
          this.__updateTarget();
        } );
      }
    }
  }

  private __updateTarget(): void {
    if ( RTINSPECTOR_CAPTURE_NAME != null ) {
      const target = BufferRenderTarget.nameMap.get( RTINSPECTOR_CAPTURE_NAME ?? '' ) ?? null;
      const attachment = DISPLAY.gl.COLOR_ATTACHMENT0 + ( RTINSPECTOR_CAPTURE_INDEX ?? 0 );
      const texture = target?.getTexture( attachment );

      if ( texture ) {
        this.material.addUniformTexture( 'sampler0', texture );
        this.entity.active = true;
        return;
      } else {
        console.warn( `RTInspector: Cannot retrieve a render target texture, RTINSPECTOR_CAPTURE_NAME: ${ RTINSPECTOR_CAPTURE_NAME }, RTINSPECTOR_CAPTURE_INDEX: ${ RTINSPECTOR_CAPTURE_INDEX }` );
      }
    }

    // fallback to not render it
    this.entity.active = false;
  }
}
