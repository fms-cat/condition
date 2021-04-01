import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers, dummyRenderTargetTwoDrawBuffers } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import depthFrag from '../shaders/depth.frag';
import quadVert from '../shaders/quad.vert';
import trailsComputeFrag from '../shaders/trails-compute.frag';
import trailsRenderFrag from '../shaders/trails-render.frag';
import trailsRenderVert from '../shaders/trails-render.vert';

const TRAILS = 4096;
const TRAIL_LENGTH = 64;

export class Trails extends Entity {
  public constructor() {
    super();

    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      trailsComputeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTargetTwoDrawBuffers } },
    );

    materialCompute.addUniform( 'trails', '1f', TRAILS );
    materialCompute.addUniform( 'trailLength', '1f', TRAIL_LENGTH );
    materialCompute.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/trails-compute.frag', () => {
          materialCompute.replaceShader( quadVert, trailsComputeFrag );
        } );
      }
    }

    // -- lambda to say update ---------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: ( { time, deltaTime } ) => {
        const shouldUpdate
          = Math.floor( 60.0 * time ) !== Math.floor( 60.0 * ( time - deltaTime ) );
        materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate ? 1 : 0 );
      },
    } ) );

    // -- geometry render --------------------------------------------------------------------------
    const geometryRender = new InstancedGeometry();

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

    geometryRender.vao.bindVertexbuffer( bufferComputeU, 0, 1 );

    const bufferComputeV = glCat.createBuffer();
    bufferComputeV.setVertexbuffer( ( () => {
      const ret = new Float32Array( TRAILS );
      for ( let i = 0; i < TRAILS; i ++ ) {
        ret[ i ] = ( i + 0.5 ) / TRAILS;
      }
      return ret;
    } )() );

    geometryRender.vao.bindVertexbuffer( bufferComputeV, 1, 1, 1 );

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

    geometryRender.vao.bindVertexbuffer( bufferTriIndex, 2, 1 );

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

    geometryRender.vao.bindIndexbuffer( indexBuffer );

    geometryRender.count = ( TRAIL_LENGTH - 1 ) * 18;
    geometryRender.primcount = TRAILS;
    geometryRender.mode = gl.TRIANGLES;
    geometryRender.indexType = gl.UNSIGNED_SHORT;

    // -- materials render -------------------------------------------------------------------------
    const deferred = new Material(
      trailsRenderVert,
      trailsRenderFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry: geometryRender, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    const depth = new Material(
      trailsRenderVert,
      depthFrag,
      { initOptions: { geometry: geometryRender, target: dummyRenderTarget } },
    );

    const materialsRender = { deferred, depth };

    deferred.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    depth.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/trails-render.vert',
            '../shaders/trails-render.frag',
          ],
          () => {
            deferred.replaceShader( trailsRenderVert, trailsRenderFrag );
            depth.replaceShader( trailsRenderVert, depthFrag );
          }
        );
      }
    }

    // -- gpu particles ----------------------------------------------------------------------------
    const gpuParticles = new GPUParticles( {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth: TRAIL_LENGTH,
      computeHeight: TRAILS,
      computeNumBuffers: 2,
      namePrefix: process.env.DEV && 'Trails',
    } );
    this.children.push( gpuParticles );
  }
}
