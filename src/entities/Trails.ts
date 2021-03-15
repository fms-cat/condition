import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import trailsComputeFrag from '../shaders/trails-compute.frag';
import trailsRenderFrag from '../shaders/trails-render.frag';
import trailsRenderVert from '../shaders/trails-render.vert';
import { gl, glCat } from '../heck/canvas';
import { randomTexture, randomTextureStatic } from '../utils/RandomTexture';

export interface TrailsOptions {
  trails: number;
  trailLength: number;
}

export class Trails {
  public get entity(): Entity {
    return this.__gpuParticles.entity;
  }

  private __gpuParticles: GPUParticles;

  public get materialCompute(): Material {
    return this.__gpuParticles.materialCompute;
  }

  public get materialRender(): Material {
    return this.__gpuParticles.materialRender;
  }

  public constructor( options: TrailsOptions ) {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute( options ),
      geometryRender: this.__createGeometryRender( options ),
      materialRender: this.__createMaterialRender( options ),
      computeWidth: options.trailLength,
      computeHeight: options.trails,
      computeNumBuffers: 2,
      namePrefix: process.env.DEV && 'Trails',
    } );
  }

  private __createMaterialCompute( options: TrailsOptions ): Material {
    const material = new Material( quadVert, trailsComputeFrag );
    material.addUniform( 'trails', '1f', options.trails );
    material.addUniform( 'trailLength', '1f', options.trailLength );
    material.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/trails-compute.frag', () => {
          material.replaceShader( quadVert, trailsComputeFrag );
        } );
      }
    }

    return material;
  }

  private __createGeometryRender( options: TrailsOptions ): Geometry {
    const geometry = new InstancedGeometry();

    const bufferComputeU = glCat.createBuffer();
    bufferComputeU.setVertexbuffer( ( () => {
      const ret = new Float32Array( options.trailLength * 3 );
      for ( let i = 0; i < options.trailLength; i ++ ) {
        const u = ( 0.5 + i ) / options.trailLength;
        ret[ i * 3 + 0 ] = u;
        ret[ i * 3 + 1 ] = u;
        ret[ i * 3 + 2 ] = u;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeU', {
      buffer: bufferComputeU,
      size: 1,
      type: gl.FLOAT
    } );

    const bufferComputeV = glCat.createBuffer();
    bufferComputeV.setVertexbuffer( ( () => {
      const ret = new Float32Array( options.trails );
      for ( let i = 0; i < options.trails; i ++ ) {
        ret[ i ] = ( i + 0.5 ) / options.trails;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeV', {
      buffer: bufferComputeV,
      size: 1,
      divisor: 1,
      type: gl.FLOAT
    } );

    const bufferTriIndex = glCat.createBuffer();
    bufferTriIndex.setVertexbuffer( ( () => {
      const ret = new Float32Array( 3 * options.trailLength );
      for ( let i = 0; i < options.trailLength; i ++ ) {
        ret[ i * 3 + 0 ] = 0;
        ret[ i * 3 + 1 ] = 1;
        ret[ i * 3 + 2 ] = 2;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'triIndex', {
      buffer: bufferTriIndex,
      size: 1,
      type: gl.FLOAT
    } );

    const indexBuffer = glCat.createBuffer();
    indexBuffer.setIndexbuffer( ( () => {
      const ret = new Uint16Array( ( options.trailLength - 1 ) * 18 );
      for ( let i = 0; i < options.trailLength - 1; i ++ ) {
        for ( let j = 0; j < 3; j ++ ) {
          const jn = ( j + 1 ) % 3;
          ret[ i * 18 + j * 6 + 0 ] = i * 3 + j;
          ret[ i * 18 + j * 6 + 1 ] = i * 3 + 3 + j;
          ret[ i * 18 + j * 6 + 2 ] = i * 3 + 3 + jn;
          ret[ i * 18 + j * 6 + 3 ] = i * 3 + j;
          ret[ i * 18 + j * 6 + 4 ] = i * 3 + 3 + jn;
          ret[ i * 18 + j * 6 + 5 ] = i * 3 + jn;
        }
      }
      return ret;
    } )() );

    geometry.setIndex( {
      buffer: indexBuffer,
      type: gl.UNSIGNED_SHORT
    } );

    geometry.count = ( options.trailLength - 1 ) * 18;
    geometry.primcount = options.trails;
    geometry.mode = gl.TRIANGLES;

    return geometry;
  }

  private __createMaterialRender( options: TrailsOptions ): Material {
    const material = new Material(
      trailsRenderVert,
      trailsRenderFrag,
    );
    material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/trails-render.vert', () => {
          material.replaceShader(
            trailsRenderVert,
            trailsRenderFrag,
          );
        } );
      }

      if ( module.hot ) {
        module.hot.accept( '../shaders/trails-render.frag', () => {
          material.replaceShader(
            trailsRenderVert,
            trailsRenderFrag,
          );
        } );
      }
    }

    return material;
  }
}
