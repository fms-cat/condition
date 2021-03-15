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
import { gl, glCat } from '../globals/canvas';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';

const PARTICLES_SQRT = 256;
const PARTICLES = PARTICLES_SQRT * PARTICLES_SQRT;

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

  public constructor() {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute(),
      geometryRender: this.__createGeometryRender(),
      materialRender: this.__createMaterialRender(),
      computeWidth: PARTICLES_SQRT,
      computeHeight: PARTICLES_SQRT,
      computeNumBuffers: 2,
      namePrefix: process.env.DEV && 'SphereParticles',
    } );
  }

  private __createMaterialCompute(): Material {
    const material = new Material( quadVert, sphereParticleComputeFrag );
    material.addUniform( 'particlesSqrt', '1f', PARTICLES_SQRT );
    material.addUniform( 'particles', '1f', PARTICLES );
    material.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/sphere-particles-compute.frag', () => {
          material.replaceShader( quadVert, sphereParticleComputeFrag );
        } );
      }
    }

    return material;
  }

  private __createGeometryRender(): Geometry {
    const octahedron = genOctahedron( { radius: 1.0, div: 1 } );

    const geometry = new InstancedGeometry();

    geometry.addAttribute( 'position', octahedron.position );
    geometry.addAttribute( 'normal', octahedron.normal );
    geometry.setIndex( octahedron.index );

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

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;
    geometry.primcount = PARTICLES_SQRT * PARTICLES_SQRT;

    return geometry;
  }

  private __createMaterialRender(): Material {
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
    material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

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
