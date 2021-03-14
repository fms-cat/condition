import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import flickyParticleComputeFrag from '../shaders/flicky-particles-compute.frag';
import flickyParticleRenderFrag from '../shaders/flicky-particles-render.frag';
import flickyParticleRenderVert from '../shaders/flicky-particles-render.vert';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { gl, glCat } from '../heck/canvas';

export interface FlickyParticlesOptions {
  particlesSqrt: number;
  textureRandom: GLCatTexture<WebGL2RenderingContext>;
  textureRandomStatic: GLCatTexture<WebGL2RenderingContext>;
}

export class FlickyParticles {
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

  public constructor( options: FlickyParticlesOptions ) {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute( options ),
      geometryRender: this.__createGeometryRender( options ),
      materialRender: this.__createMaterialRender( options ),
      computeWidth: options.particlesSqrt,
      computeHeight: options.particlesSqrt,
      computeNumBuffers: 1,
      namePrefix: process.env.DEV && 'FlickyParticles',
    } );
  }

  private __createMaterialCompute( options: FlickyParticlesOptions ): Material {
    const { particlesSqrt } = options;
    const particles = particlesSqrt * particlesSqrt;

    const material = new Material( quadVert, flickyParticleComputeFrag );
    material.addUniform( 'particlesSqrt', '1f', particlesSqrt );
    material.addUniform( 'particles', '1f', particles );
    material.addUniformTexture( 'samplerRandom', options.textureRandom );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/flicky-particles-compute.frag', () => {
          material.replaceShader( quadVert, flickyParticleComputeFrag );
        } );
      }
    }

    return material;
  }

  private __createGeometryRender( options: FlickyParticlesOptions ): Geometry {
    const { particlesSqrt } = options;
    const particles = particlesSqrt * particlesSqrt;

    const geometry = new InstancedGeometry();

    const bufferP = glCat.createBuffer();
    bufferP.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    geometry.addAttribute( 'position', {
      buffer: bufferP,
      size: 2,
      type: gl.FLOAT,
    } );

    const bufferComputeUV = glCat.createBuffer();
    bufferComputeUV.setVertexbuffer( ( () => {
      const ret = new Float32Array( particles * 2 );
      for ( let iy = 0; iy < particlesSqrt; iy ++ ) {
        for ( let ix = 0; ix < particlesSqrt; ix ++ ) {
          const i = ix + iy * particlesSqrt;
          const s = ( ix + 0.5 ) / particlesSqrt;
          const t = ( iy + 0.5 ) / particlesSqrt;
          ret[ i * 2 + 0 ] = s;
          ret[ i * 2 + 1 ] = t;
        }
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeUV', {
      buffer: bufferComputeUV,
      size: 2,
      divisor: 1,
      type: gl.FLOAT
    } );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;
    geometry.primcount = options.particlesSqrt * options.particlesSqrt;

    return geometry;
  }

  private __createMaterialRender( options: FlickyParticlesOptions ): Material {
    const material = new Material(
      flickyParticleRenderVert,
      flickyParticleRenderFrag,
    );
    material.addUniform( 'colorVar', '1f', 0.1 );
    material.addUniformTexture( 'samplerRandomStatic', options.textureRandomStatic );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/flicky-particles-render.vert', () => {
          material.replaceShader(
            flickyParticleRenderVert,
            flickyParticleRenderFrag,
          );
        } );
      }
    }

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/flicky-particles-render.frag', () => {
          material.replaceShader(
            flickyParticleRenderVert,
            flickyParticleRenderFrag,
          );
        } );
      }
    }

    return material;
  }
}
