import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { auto } from '../globals/automaton';
import { dummyRenderTargetFourDrawBuffers, dummyRenderTargetTwoDrawBuffers } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { matrix2d } from '@fms-cat/experimental';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import quadVert from '../shaders/quad.vert';
import racerComputeFrag from '../shaders/racer-compute.frag';
import racerRenderFrag from '../shaders/racer-render.frag';
import racerRenderVert from '../shaders/racer-render.vert';

const TRAILS = 4096;
const TRAIL_LENGTH = 64;

export class Racer extends Entity {
  public constructor() {
    super();

    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      racerComputeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTargetTwoDrawBuffers } },
    );

    materialCompute.addUniform( 'trails', '1f', TRAILS );
    materialCompute.addUniform( 'trailLength', '1f', TRAIL_LENGTH );
    materialCompute.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/racer-compute.frag', () => {
          materialCompute.replaceShader( quadVert, racerComputeFrag );
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
    const geometryRender = new Geometry();

    const bufferComputeUV = glCat.createBuffer();
    bufferComputeUV.setVertexbuffer(
      new Float32Array( matrix2d( TRAIL_LENGTH, TRAILS ) ).map( ( v, i ) => {
        if ( i % 2 === 0 ) { return ( v + 0.5 ) / TRAIL_LENGTH; }
        else { return ( v + 0.5 ) / TRAILS; }
      } )
    );

    geometryRender.vao.bindVertexbuffer( bufferComputeUV, 0, 2 );

    geometryRender.count = TRAILS * TRAIL_LENGTH;
    geometryRender.mode = gl.POINTS;

    // -- materials render -------------------------------------------------------------------------
    const forward = new Material(
      racerRenderVert,
      racerRenderFrag,
      {
        defines: [ 'FORWARD 1' ],
        initOptions: { geometry: geometryRender, target: dummyRenderTargetFourDrawBuffers },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    // const cubemap = new Material(
    //   racerRenderVert,
    //   racerRenderFrag,
    //   {
    //     defines: [ 'FORWARD 1', 'CUBEMAP 1' ],
    //     initOptions: { geometry: geometryRender, target: dummyRenderTargetFourDrawBuffers },
    //     blend: [ gl.ONE, gl.ONE ],
    //   },
    // );

    const deferred = new Material(
      racerRenderVert,
      racerRenderFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry: geometryRender, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    forward.addUniform( 'trails', '1f', TRAILS );
    forward.addUniform( 'trailLength', '1f', TRAIL_LENGTH );

    // cubemap.addUniform( 'trails', '1f', TRAILS );
    // cubemap.addUniform( 'trailLength', '1f', TRAIL_LENGTH );

    deferred.addUniform( 'trails', '1f', TRAILS );
    deferred.addUniform( 'trailLength', '1f', TRAIL_LENGTH );

    const materialsRender = { forward, deferred };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/racer-render.vert',
            '../shaders/racer-render.frag',
          ],
          () => {
            forward.replaceShader( racerRenderVert, racerRenderFrag );
            // cubemap.replaceShader( racerRenderVert, racerRenderFrag );
            deferred.replaceShader( racerRenderVert, racerRenderFrag );
          }
        );
      }
    }

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Racer/active', ( { init, uninit } ) => {
      this.active = !uninit;
      this.visible = !uninit;

      materialCompute.addUniform( 'init', '1i', init ? 1 : 0 );
    } );

    // -- gpu particles ----------------------------------------------------------------------------
    const gpuParticles = new GPUParticles( {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth: TRAIL_LENGTH,
      computeHeight: TRAILS,
      computeNumBuffers: 2,
      namePrefix: process.env.DEV && 'Racer',
    } );
    gpuParticles.meshRender.depthWrite = false;
    this.children.push( gpuParticles );
  }
}
