import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { Swap } from '@fms-cat/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import quadVert from '../shaders/quad.vert';
import shadowBlurFrag from '../shaders/shadow-blur.frag';

export interface LightEntityOptions {
  root: Entity;
  shadowMapFov?: number;
  shadowMapNear?: number;
  shadowMapFar?: number;
  shadowMapWidth?: number;
  shadowMapHeight?: number;
  namePrefix?: string;
}

export class LightEntity extends Entity {
  public color: [ number, number, number ] = [ 1.0, 1.0, 1.0 ];
  public root: Entity;
  public camera: PerspectiveCamera;
  public shadowMap: BufferRenderTarget;

  public constructor( options: LightEntityOptions ) {
    super();

    this.root = options.root;

    const swapOptions = {
      width: options.shadowMapWidth ?? 1024,
      height: options.shadowMapHeight ?? 1024
    };

    const swap = new Swap(
      new BufferRenderTarget( {
        ...swapOptions,
        name: process.env.DEV && `${ options.namePrefix }/swap0`,
      } ),
      new BufferRenderTarget( {
        ...swapOptions,
        name: process.env.DEV && `${ options.namePrefix }/swap1`,
      } )
    );

    // -- camera -----------------------------------------------------------------------------------
    const fov = options.shadowMapFov ?? 45.0;
    const near = options.shadowMapNear ?? 0.1;
    const far = options.shadowMapFar ?? 100.0;

    this.camera = new PerspectiveCamera( {
      fov,
      near,
      far,
      renderTarget: swap.o,
      scene: this.root,
      name: process.env.DEV && `${ options.namePrefix }/shadowMapCamera`,
      materialTag: 'depth',
    } );
    this.camera.clear = [ 1.0, 1.0, 1.0, 1.0 ];
    this.components.push( this.camera );

    this.shadowMap = new BufferRenderTarget( {
      width: options.shadowMapWidth ?? 1024,
      height: options.shadowMapHeight ?? 1024,
      name: process.env.DEV && `${ options.namePrefix }/shadowMap`,
    } );

    swap.swap();

    // -- blur -------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        quadVert,
        shadowBlurFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.components.push( new Quad( {
        target: i === 0 ? swap.o : this.shadowMap,
        material,
        name: process.env.DEV && `${ options.namePrefix }/quadShadowBlur${ i }`,
      } ) );

      swap.swap();
    }
  }
}
