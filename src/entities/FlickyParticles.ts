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
import { gl, glCat } from '../globals/canvas';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';

const PARTICLES_SQRT = 8;
const PARTICLES = PARTICLES_SQRT * PARTICLES_SQRT;

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

  public constructor() {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute(),
      geometryRender: this.__createGeometryRender(),
      materialRender: this.__createMaterialRender(),
      computeWidth: PARTICLES_SQRT,
      computeHeight: PARTICLES_SQRT,
      computeNumBuffers: 1,
      namePrefix: process.env.DEV && 'FlickyParticles',
    } );
  }

  private __createMaterialCompute(): Material {
    const material = new Material( quadVert, flickyParticleComputeFrag );
    material.addUniform( 'particlesSqrt', '1f', PARTICLES_SQRT );
    material.addUniform( 'particles', '1f', PARTICLES );
    material.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/flicky-particles-compute.frag', () => {
          material.replaceShader( quadVert, flickyParticleComputeFrag );
        } );
      }
    }

    return material;
  }

  private __createGeometryRender(): Geometry {
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
      const ret = new Float32Array( PARTICLES * 2 );
      for ( let iy = 0; iy < PARTICLES_SQRT; iy ++ ) {
        for ( let ix = 0; ix < PARTICLES_SQRT; ix ++ ) {
          const i = ix + iy * PARTICLES_SQRT;
          const s = ( ix + 0.5 ) / PARTICLES_SQRT;
          const t = ( iy + 0.5 ) / PARTICLES_SQRT;
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
    geometry.primcount = PARTICLES;

    return geometry;
  }

  private __createMaterialRender(): Material {
    const material = new Material(
      flickyParticleRenderVert,
      flickyParticleRenderFrag,
    );
    material.addUniform( 'colorVar', '1f', 0.1 );
    material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

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
