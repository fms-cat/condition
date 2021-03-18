import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material, MaterialMap } from '../heck/Material';
import { genOctahedron } from '../geometries/genOctahedron';
import depthFrag from '../shaders/depth.frag';
import discardFrag from '../shaders/discard.frag';
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
    return this.gpuParticles.entity;
  }

  public gpuParticles: GPUParticles;

  public constructor() {
    this.gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute(),
      geometryRender: this.__createGeometryRender(),
      materialsRender: this.__createMaterialsRender(),
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

  private __createMaterialsRender(): MaterialMap<'deferred' | 'shadow'> {
    const deferred = new Material(
      sphereParticleRenderVert,
      sphereParticleRenderFrag,
      { defines: { 'DEFERRED': 'true' } },
    );
    deferred.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

    const shadow = new Material( sphereParticleRenderVert, depthFrag );
    shadow.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/sphere-particles-render.vert',
            '../shaders/sphere-particles-render.frag',
          ],
          () => {
            deferred.replaceShader( sphereParticleRenderVert, sphereParticleRenderFrag );
            shadow.replaceShader( sphereParticleRenderVert, depthFrag );
          }
        );
      }
    }

    return { deferred, shadow };
  }
}
