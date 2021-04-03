import { BufferRenderTarget, BufferRenderTargetOptions } from '../heck/BufferRenderTarget';
import { Entity, EntityOptions } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material, MaterialMap } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quad } from '../heck/components/Quad';
import { Swap } from '@fms-cat/experimental';
import { gl } from '../globals/canvas';
import { objectValuesMap } from '../utils/objectEntriesMap';

export interface GPUParticlesOptions extends EntityOptions {
  materialCompute: Material;
  geometryRender: Geometry;
  materialsRender: MaterialMap;
  computeWidth: number;
  computeHeight: number;
  computeNumBuffers: number;
  brtNamePrefix?: string;
}

export class GPUParticles extends Entity {
  public meshRender: Mesh;

  public constructor( options: GPUParticlesOptions ) {
    super( options );

    const {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth,
      computeHeight,
      computeNumBuffers,
      brtNamePrefix,
    } = options;

    const brtOptions: BufferRenderTargetOptions = {
      width: computeWidth,
      height: computeHeight,
      numBuffers: computeNumBuffers,
    };

    const swapCompute = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ brtNamePrefix }/swap0`,
        filter: gl.NEAREST,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ brtNamePrefix }/swap1`,
        filter: gl.NEAREST,
      } ),
    );

    // -- compute ----------------------------------------------------------------------------------
    const quadCompute = new Quad( {
      target: swapCompute.o,
      material: materialCompute,
      name: process.env.DEV && 'quadCompute',
    } );

    // -- render -----------------------------------------------------------------------------------
    this.meshRender = new Mesh( {
      geometry: geometryRender,
      materials: materialsRender,
      name: process.env.DEV && 'meshRender',
    } );

    objectValuesMap( materialsRender, ( material ) => {
      material?.addUniform(
        'resolutionCompute',
        '2f',
        computeWidth,
        computeHeight
      );
    } );

    // -- swapper ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: () => {
        swapCompute.swap();

        for ( let i = 0; i < computeNumBuffers; i ++ ) {
          const attachment = gl.COLOR_ATTACHMENT0 + i;

          materialCompute.addUniformTextures(
            `samplerCompute${ i }`,
            swapCompute.i.getTexture( attachment )!
          );

          objectValuesMap( materialsRender, ( material ) => {
            material?.addUniformTextures(
              `samplerCompute${ i }`,
              swapCompute.o.getTexture( attachment )!
            );
          } );
        }

        quadCompute.target = swapCompute.o;
      },
      name: process.env.DEV && 'swapper',
    } ) );

    // -- rest of components -----------------------------------------------------------------------
    this.components.push(
      quadCompute,
      this.meshRender,
    );
  }
}
