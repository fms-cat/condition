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

export class GPUParticles extends Entity {
  public constructor( {
    materialCompute,
    geometryRender,
    materialsRender,
    computeWidth,
    computeHeight,
    computeNumBuffers,
    namePrefix,
  }: GPUParticlesOptions ) {
    super();


    const brtOptions: BufferRenderTargetOptions = {
      width: computeWidth,
      height: computeHeight,
      numBuffers: computeNumBuffers,
    };

    const swapCompute = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ namePrefix }/swap0`,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ namePrefix }/swap1`,
      } ),
    );

    // -- compute ----------------------------------------------------------------------------------
    const quadCompute = new Quad( {
      target: swapCompute.o,
      material: materialCompute,
      name: process.env.DEV && `${ namePrefix }/quadCompute`,
    } );

    // -- render -----------------------------------------------------------------------------------
    const meshRender = new Mesh( {
      geometry: geometryRender,
      materials: materialsRender,
      name: process.env.DEV && `${ namePrefix }/meshRender`,
    } );

    for ( const material of Object.values( materialsRender ) ) {
      material?.addUniform(
        'resolutionCompute',
        '2f',
        computeWidth,
        computeHeight
      );
    }

    // -- swapper ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: () => {
        swapCompute.swap();

        for ( let i = 0; i < computeNumBuffers; i ++ ) {
          const attachment = gl.COLOR_ATTACHMENT0 + i;

          materialCompute.addUniformTexture(
            `samplerCompute${ i }`,
            swapCompute.i.getTexture( attachment )
          );

          for ( const material of Object.values( materialsRender ) ) {
            material?.addUniformTexture(
              `samplerCompute${ i }`,
              swapCompute.o.getTexture( attachment )
            );
          }
        }

        quadCompute.target = swapCompute.o;
      },
      name: process.env.DEV && `${ namePrefix }/swapper`,
    } ) );

    // -- rest of components -----------------------------------------------------------------------
    this.components.push( quadCompute );
    this.components.push( meshRender );
  }
}
