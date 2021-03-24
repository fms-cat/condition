import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import flickyParticleComputeFrag from '../shaders/flicky-particles-compute.frag';
import flickyParticleRenderFrag from '../shaders/flicky-particles-render.frag';
import flickyParticleRenderVert from '../shaders/flicky-particles-render.vert';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { gl, glCat } from '../globals/canvas';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import { quadGeometry } from '../globals/quadGeometry';
import { dummyRenderTargetFourDrawBuffers, dummyRenderTarget } from '../globals/dummyRenderTarget';

const PARTICLES_SQRT = 8;
const PARTICLES = PARTICLES_SQRT * PARTICLES_SQRT;

export class FlickyParticles extends Entity {
  public constructor() {
    super();

    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      flickyParticleComputeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    materialCompute.addUniform( 'particlesSqrt', '1f', PARTICLES_SQRT );
    materialCompute.addUniform( 'particles', '1f', PARTICLES );
    materialCompute.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/flicky-particles-compute.frag', () => {
          materialCompute.replaceShader( quadVert, flickyParticleComputeFrag );
        } );
      }
    }

    // -- geometry render --------------------------------------------------------------------------
    const geometryRender = new InstancedGeometry();

    const bufferP = glCat.createBuffer();
    bufferP.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    geometryRender.vao.bindVertexbuffer( bufferP, 0, 2 );

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

    geometryRender.vao.bindVertexbuffer( bufferComputeUV, 1, 2, 1 );

    geometryRender.count = 4;
    geometryRender.mode = gl.TRIANGLE_STRIP;
    geometryRender.primcount = PARTICLES;

    // -- materials render -------------------------------------------------------------------------
    const forward = new Material(
      flickyParticleRenderVert,
      flickyParticleRenderFrag,
      {
        defines: { 'FORWARD': 'true' },
        initOptions: { geometry: geometryRender, target: dummyRenderTarget },
      },
    );

    const deferred = new Material(
      flickyParticleRenderVert,
      flickyParticleRenderFrag,
      {
        defines: { 'DEFERRED': 'true' },
        initOptions: { geometry: geometryRender, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const shadow = new Material(
      flickyParticleRenderVert,
      flickyParticleRenderFrag,
      {
        defines: { 'SHADOW': 'true' },
        initOptions: { geometry: geometryRender, target: dummyRenderTarget },
      },
    );

    const materialsRender = { forward, deferred, shadow };

    for ( const material of Object.values( materialsRender ) ) {
      material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    }

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/flicky-particles-render.vert',
            '../shaders/flicky-particles-render.frag',
          ],
          () => {
            forward.replaceShader( flickyParticleRenderVert, flickyParticleRenderFrag );
            deferred.replaceShader( flickyParticleRenderVert, flickyParticleRenderFrag );
            shadow.replaceShader( flickyParticleRenderVert, flickyParticleRenderFrag );
          }
        );
      }
    }

    // -- gpu particles ----------------------------------------------------------------------------
    const gpuParticles = new GPUParticles( {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth: PARTICLES_SQRT,
      computeHeight: PARTICLES_SQRT,
      computeNumBuffers: 1,
      namePrefix: process.env.DEV && 'FlickyParticles',
    } );
    this.children.push( gpuParticles );
  }
}
