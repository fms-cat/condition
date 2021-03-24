import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material, MaterialMap } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import depthFrag from '../shaders/depth.frag';
import trailsComputeFrag from '../shaders/trails-compute.frag';
import trailsRenderFrag from '../shaders/trails-render.frag';
import trailsRenderVert from '../shaders/trails-render.vert';
import { gl, glCat } from '../globals/canvas';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';

const TRAILS = 4096;
const TRAIL_LENGTH = 64;

export class Trails {
  public get entity(): Entity {
    return this.gpuParticles.entity;
  }

  public gpuParticles: GPUParticles;

  public constructor() {
    this.gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute(),
      geometryRender: this.__createGeometryRender(),
      materialsRender: this.__createMaterialsRender(),
      computeWidth: TRAIL_LENGTH,
      computeHeight: TRAILS,
      computeNumBuffers: 2,
      namePrefix: process.env.DEV && 'Trails',
    } );
  }

  private __createMaterialCompute(): Material {
    const material = new Material( quadVert, trailsComputeFrag );
    material.addUniform( 'trails', '1f', TRAILS );
    material.addUniform( 'trailLength', '1f', TRAIL_LENGTH );
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

  private __createGeometryRender(): Geometry {
    const geometry = new InstancedGeometry();

    const bufferComputeU = glCat.createBuffer();
    bufferComputeU.setVertexbuffer( ( () => {
      const ret = new Float32Array( TRAIL_LENGTH * 3 );
      for ( let i = 0; i < TRAIL_LENGTH; i ++ ) {
        const u = ( 0.5 + i ) / TRAIL_LENGTH;
        ret[ i * 3 + 0 ] = u;
        ret[ i * 3 + 1 ] = u;
        ret[ i * 3 + 2 ] = u;
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferComputeU, 0, 1 );

    const bufferComputeV = glCat.createBuffer();
    bufferComputeV.setVertexbuffer( ( () => {
      const ret = new Float32Array( TRAILS );
      for ( let i = 0; i < TRAILS; i ++ ) {
        ret[ i ] = ( i + 0.5 ) / TRAILS;
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferComputeV, 1, 1, 1 );

    const bufferTriIndex = glCat.createBuffer();
    bufferTriIndex.setVertexbuffer( ( () => {
      const ret = new Float32Array( 3 * TRAIL_LENGTH );
      for ( let i = 0; i < TRAIL_LENGTH; i ++ ) {
        ret[ i * 3 + 0 ] = 0;
        ret[ i * 3 + 1 ] = 1;
        ret[ i * 3 + 2 ] = 2;
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferTriIndex, 2, 1 );

    const indexBuffer = glCat.createBuffer();
    indexBuffer.setIndexbuffer( ( () => {
      const ret = new Uint16Array( ( TRAIL_LENGTH - 1 ) * 18 );
      for ( let i = 0; i < TRAIL_LENGTH - 1; i ++ ) {
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

    geometry.vao.bindIndexbuffer( indexBuffer );

    geometry.count = ( TRAIL_LENGTH - 1 ) * 18;
    geometry.primcount = TRAILS;
    geometry.mode = gl.TRIANGLES;
    geometry.indexType = gl.UNSIGNED_SHORT;

    return geometry;
  }

  private __createMaterialsRender(): MaterialMap<'deferred' | 'shadow'> {
    const deferred = new Material(
      trailsRenderVert,
      trailsRenderFrag,
      { defines: { 'DEFERRED': 'true' } },
    );
    deferred.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

    const shadow = new Material( trailsRenderVert, depthFrag );
    shadow.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/trails-render.vert',
            '../shaders/trails-render.frag',
          ],
          () => {
            deferred.replaceShader( trailsRenderVert, trailsRenderFrag );
            shadow.replaceShader( trailsRenderVert, depthFrag );
          }
        );
      }
    }

    return { deferred, shadow };
  }
}
