import { GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import { genOctahedron } from '../geometries/genOctahedron';
import quadVert from '../shaders/quad.vert';
import sphereParticleComputeFrag from '../shaders/sphere-particles-compute.frag';
import sphereParticleRenderFrag from '../shaders/sphere-particles-render.frag';
import sphereParticleRenderVert from '../shaders/sphere-particles-render.vert';

export interface SphereParticlesOptions {
  particlesSqrt: number;
  textureRandom: GLCatTexture<WebGL2RenderingContext>;
  textureRandomStatic: GLCatTexture<WebGL2RenderingContext>;
}

export class SphereParticles {
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

  public constructor( options: SphereParticlesOptions ) {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute( options ),
      geometryRender: this.__createGeometryRender( options ),
      materialRender: this.__createMaterialRender( options ),
      computeWidth: options.particlesSqrt,
      computeHeight: options.particlesSqrt,
      computeNumBuffers: 2,
      namePrefix: process.env.DEV && 'SphereParticles',
    } );
  }

  private __createMaterialCompute( options: SphereParticlesOptions ): Material {
    const { particlesSqrt } = options;
    const particles = particlesSqrt * particlesSqrt;

    const material = new Material( quadVert, sphereParticleComputeFrag );
    material.addUniform( 'particlesSqrt', '1f', particlesSqrt );
    material.addUniform( 'particles', '1f', particles );
    material.addUniformTexture( 'samplerRandom', options.textureRandom );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/sphere-particles-compute.frag', () => {
          material.replaceShader( quadVert, sphereParticleComputeFrag );
        } );
      }
    }

    return material;
  }

  private __createGeometryRender( options: SphereParticlesOptions ): Geometry {
    const { particlesSqrt } = options;
    const particles = particlesSqrt * particlesSqrt;

    const octahedron = genOctahedron( { radius: 1.0, div: 1 } );

    const geometry = new InstancedGeometry();

    geometry.addAttribute( 'position', octahedron.position );
    geometry.addAttribute( 'normal', octahedron.normal );
    geometry.setIndex( octahedron.index );

    const bufferComputeUV = DISPLAY.glCat.createBuffer();
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
      type: DISPLAY.gl.FLOAT
    } );

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;
    geometry.primcount = options.particlesSqrt * options.particlesSqrt;

    return geometry;
  }

  private __createMaterialRender( options: SphereParticlesOptions ): Material {
    const material = new Material(
      sphereParticleRenderVert,
      sphereParticleRenderFrag,
      {
        defines: {
          'USE_CLIP': 'true',
          'USE_VERTEX_COLOR': 'true'
        },
      },
    );
    material.addUniform( 'colorVar', '1f', 0.1 );
    material.addUniformTexture( 'samplerRandomStatic', options.textureRandomStatic );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/sphere-particles-render.vert', () => {
          material.replaceShader(
            sphereParticleRenderVert,
            sphereParticleRenderFrag,
          );
        } );
      }
    }

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/sphere-particles-render.frag', () => {
          material.replaceShader(
            sphereParticleRenderVert,
            sphereParticleRenderFrag,
          );
        } );
      }
    }

    return material;
  }
}
