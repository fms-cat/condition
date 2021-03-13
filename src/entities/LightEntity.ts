import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { Swap } from '@fms-cat/experimental';
import posToDepthFrag from '../shaders/pos-to-depth.frag';
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

export class LightEntity {
  public color: [ number, number, number ] = [ 1.0, 1.0, 1.0 ];

  private __root: Entity;

  public get root(): Entity {
    return this.__root;
  }

  private __shadowMapCamera: PerspectiveCamera;

  public get camera(): PerspectiveCamera {
    return this.__shadowMapCamera;
  }

  private __shadowMap: BufferRenderTarget;

  public get shadowMap(): BufferRenderTarget {
    return this.__shadowMap;
  }

  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: LightEntityOptions ) {
    this.__root = options.root;

    this.__entity = new Entity();

    const swapOptions = {
      width: options.shadowMapWidth || 1024,
      height: options.shadowMapHeight || 1024
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
    const fov = options.shadowMapFov || 45.0;
    const near = options.shadowMapNear || 0.1;
    const far = options.shadowMapFar || 100.0;

    this.__shadowMapCamera = new PerspectiveCamera( {
      fov,
      near,
      far,
      renderTarget: swap.o,
      scene: this.__root,
      name: process.env.DEV && `${ options.namePrefix }/shadowMapCamera`,
    } );
    this.__shadowMapCamera.clear = [ 1.0, 1.0, 1.0, 1.0 ];
    this.__entity.components.push( this.__shadowMapCamera );

    this.__shadowMap = new BufferRenderTarget( {
      width: options.shadowMapWidth || 2048,
      height: options.shadowMapHeight || 2048,
      name: process.env.DEV && `${ options.namePrefix }/shadowMap`,
    } );

    swap.swap();

    // -- convert ----------------------------------------------------------------------------------
    const materialConvert = new Material(
      quadVert,
      posToDepthFrag
    );

    materialConvert.addUniformTexture( 'sampler0', swap.i.texture );

    this.__entity.components.push( new Lambda( {
      onUpdate: () => {
        materialConvert.addUniform( 'cameraPos', '3f', ...this.entity.transform.position.elements );
        materialConvert.addUniform( 'cameraNearFar', '2f', this.camera.near, this.camera.far );
      },
      visible: false,
      name: process.env.DEV && `${ options.namePrefix }/setCameraUniforms`,
    } ) );

    this.__entity.components.push( new Quad( {
      target: swap.o,
      material: materialConvert,
      name: process.env.DEV && `${ options.namePrefix }/quadConvertPosToDepth`,
    } ) );

    swap.swap();

    // -- blur ---------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        quadVert,
        shadowBlurFrag
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.__entity.components.push( new Quad( {
        target: i === 0 ? swap.o : this.__shadowMap,
        material,
        name: process.env.DEV && `${ options.namePrefix }/quadShadowBlur${ i }`,
      } ) );

      swap.swap();
    }
  }
}
