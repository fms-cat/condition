import { Camera } from './Camera';
import { ComponentOptions, ComponentUpdateEvent } from './Component';
import { CubemapRenderTarget } from '../CubemapRenderTarget';
import { Entity } from '../Entity';
import { MaterialTag } from '../Material';
import { Matrix4, Quaternion, Vector3 } from '@fms-cat/experimental';
import { Transform } from '../Transform';
import { gl } from '../../globals/canvas';

const INV_SQRT2 = 1.0 / Math.sqrt( 2.0 );

const CUBEMAP_ROTATIONS = [ // 🔥
  new Quaternion( [ 0.0, INV_SQRT2, 0.0, INV_SQRT2 ] ), // PX
  new Quaternion( [ 0.0, -INV_SQRT2, 0.0, INV_SQRT2 ] ), // NX
  new Quaternion( [ 0.0, INV_SQRT2, INV_SQRT2, 0.0 ] ), // PY
  new Quaternion( [ 0.0, INV_SQRT2, -INV_SQRT2, 0.0 ] ), // NY
  new Quaternion( [ 0.0, 1.0, 0.0, 0.0 ] ), // PZ
  new Quaternion( [ 0.0, 0.0, 0.0, 1.0 ] ), // NZ
];

export interface CubemapCameraOptions extends ComponentOptions {
  materialTag: MaterialTag;
  renderTarget?: CubemapRenderTarget;
  near?: number;
  far?: number;
  scenes?: Entity[];
  clear?: Array<number | undefined> | false;
}

export class CubemapCamera extends Camera {
  public renderTarget?: CubemapRenderTarget;
  public readonly near: number;
  public readonly far: number;

  public constructor( options: CubemapCameraOptions ) {
    const projectionMatrix = Matrix4.perspective(
      90.0,
      options.near ?? 0.1,
      options.far ?? 20.0,
    );

    super( {
      ...options,
      projectionMatrix,
      renderTarget: options.renderTarget,
      scenes: options.scenes,
      clear: options.clear,
      materialTag: options.materialTag,
    } );

    this.near = options.near ?? 0.1;
    this.far = options.far ?? 20.0;
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    const { renderTarget } = this;

    if ( !renderTarget ) {
      throw process.env.DEV && new Error( 'You must assign a renderTarget to the Camera' );
    }

    for ( let i = 0; i < 6; i ++ ) {
      renderTarget.framebuffer.attachTexture(
        renderTarget.texture,
        { textarget: gl.TEXTURE_CUBE_MAP_POSITIVE_X + i },
      );

      const globalTransform = new Transform();
      globalTransform.matrix = Matrix4.compose(
        event.globalTransform.position,
        CUBEMAP_ROTATIONS[ i ],
        new Vector3( [ 1.0, 1.0, 1.0 ] ),
      );

      super.__updateImpl( {
        ...event,
        globalTransform,
      } );
    }
  }
}
