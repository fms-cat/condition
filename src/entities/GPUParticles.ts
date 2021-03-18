import { BufferRenderTarget, BufferRenderTargetOptions } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material, MaterialMap, MaterialTag } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quad } from '../heck/components/Quad';
import { Swap } from '@fms-cat/experimental';
import { gl } from '../globals/canvas';

export interface GPUParticlesOptions {
  materialCompute: Material;
  geometryRender: Geometry;
  materialsRender: Partial<MaterialMap<MaterialTag>>;
  computeWidth: number;
  computeHeight: number;
  computeNumBuffers: number;
  namePrefix?: string;
}

export class GPUParticles {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  private __swapCompute: Swap<BufferRenderTarget>;

  private __quadCompute: Quad;

  private __meshRender: Mesh;

  public get meshRender(): Mesh {
    return this.__meshRender;
  }

  public get materialCompute(): Material {
    return this.__quadCompute.material;
  }

  public get materialsRender(): Partial<MaterialMap<MaterialTag>> {
    return this.__meshRender.materials;
  }

  public constructor( options: GPUParticlesOptions ) {
    this.__entity = new Entity();

    const brtOptions: BufferRenderTargetOptions = {
      width: options.computeWidth,
      height: options.computeHeight,
      numBuffers: options.computeNumBuffers,
    };

    this.__swapCompute = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ options.namePrefix }/swap0`,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ options.namePrefix }/swap1`,
      } ),
    );

    // -- swapper ----------------------------------------------------------------------------------
    this.__entity.components.push( new Lambda( {
      onUpdate: () => {
        this.__swapCompute.swap();

        for ( let i = 0; i < options.computeNumBuffers; i ++ ) {
          const attachment = gl.COLOR_ATTACHMENT0 + i;

          this.materialCompute.addUniformTexture(
            `samplerCompute${ i }`,
            this.__swapCompute.i.getTexture( attachment )
          );

          for ( const material of Object.values( this.materialsRender ) ) {
            material?.addUniformTexture(
              `samplerCompute${ i }`,
              this.__swapCompute.o.getTexture( attachment )
            );
          }
        }

        this.__quadCompute.target = this.__swapCompute.o;
      },
      visible: false,
      name: process.env.DEV && `${ options.namePrefix }/swapper`,
    } ) );

    // -- compute ----------------------------------------------------------------------------------
    this.__quadCompute = new Quad( {
      target: this.__swapCompute.o,
      material: options.materialCompute,
      name: process.env.DEV && `${ options.namePrefix }/quadCompute`,
    } );
    this.__entity.components.push( this.__quadCompute );

    // -- render -----------------------------------------------------------------------------------
    this.__meshRender = new Mesh( {
      geometry: options.geometryRender,
      materials: options.materialsRender,
      name: process.env.DEV && `${ options.namePrefix }/meshRender`,
    } );

    for ( const material of Object.values( options.materialsRender ) ) {
      material?.addUniform(
        'resolutionCompute',
        '2f',
        options.computeWidth,
        options.computeHeight
      );
    }

    this.__entity.components.push( this.__meshRender );
  }
}
