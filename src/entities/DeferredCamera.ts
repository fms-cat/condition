import { AO_RESOLUTION_RATIO } from '../config';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { LightEntity } from './LightEntity';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import aoFrag from '../shaders/ao.frag';
import quadVert from '../shaders/quad.vert';
import shadingFrag from '../shaders/shading.frag';

export interface DeferredCameraOptions {
  scenes: Entity[];
  target: RenderTarget;
  lights: LightEntity[];
  textureIBLLUT: GLCatTexture;
  textureEnv: GLCatTexture;
}

export class DeferredCamera extends Entity {
  public cameraTarget: BufferRenderTarget;

  public constructor( options: DeferredCameraOptions ) {
    super();

    this.cameraTarget = new BufferRenderTarget( {
      width: options.target.width,
      height: options.target.height,
      numBuffers: 4,
      name: 'DeferredCamera/cameraTarget',
      filter: gl.NEAREST,
    } );

    const camera = new PerspectiveCamera( {
      scenes: options.scenes,
      renderTarget: this.cameraTarget,
      near: 0.1,
      far: 20.0,
      name: 'DeferredCamera/camera',
      materialTag: 'deferred',
    } );
    camera.clear = [];

    const aoTarget = new BufferRenderTarget( {
      width: AO_RESOLUTION_RATIO * options.target.width,
      height: AO_RESOLUTION_RATIO * options.target.height,
      name: 'DeferredCamera/aoTarget',
    } );

    const aoMaterial = new Material(
      quadVert,
      aoFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    const lambdaAoSetCameraUniforms = new Lambda( {
      onUpdate: () => {
        const cameraView = this.transform.matrix.inverse!;

        aoMaterial.addUniformMatrixVector(
          'cameraPV',
          'Matrix4fv',
          camera.projectionMatrix.multiply(
            cameraView
          ).elements
        );
      },
      name: process.env.DEV && 'DeferredCamera/ao/setCameraUniforms',
    } );

    for ( let i = 0; i < 2; i ++ ) { // it doesn't need 2 and 3
      aoMaterial.addUniformTexture(
        'sampler' + i,
        this.cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )
      );
    }

    aoMaterial.addUniformTexture( 'samplerRandom', randomTexture.texture );

    const aoQuad = new Quad( {
      material: aoMaterial,
      target: aoTarget,
      name: process.env.DEV && 'DeferredCamera/ao/quad',
    } );

    const shadingMaterial = new Material(
      quadVert,
      shadingFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );

    const shadingQuad = new Quad( {
      material: shadingMaterial,
      target: options.target,
      name: process.env.DEV && 'DeferredCamera/shading/quad',
    } );
    shadingQuad.clear = [];

    const lambda = new Lambda( {
      onUpdate: ( { frameCount } ) => {
        const lights = options.lights.filter( ( light ) => (
          frameCount === light.lastUpdateFrame
        ) );

        const cameraView = this.transform.matrix.inverse!;

        shadingMaterial.addUniform(
          'lightCount',
          '1i',
          lights.length,
        );

        shadingMaterial.addUniformMatrixVector(
          'cameraView',
          'Matrix4fv',
          cameraView.elements
        );

        shadingMaterial.addUniformMatrixVector(
          'cameraPV',
          'Matrix4fv',
          camera.projectionMatrix.multiply(
            cameraView
          ).elements
        );

        shadingMaterial.addUniform(
          'cameraNearFar',
          '2f',
          camera.near,
          camera.far
        );

        shadingMaterial.addUniform(
          'cameraPos',
          '3f',
          ...this.transform.position.elements
        );

        shadingMaterial.addUniformVector(
          'lightNearFar',
          '2fv',
          lights.map( ( light ) => [ light.camera.near, light.camera.far ] ).flat(),
        );

        shadingMaterial.addUniformVector(
          'lightPos',
          '3fv',
          lights.map( ( light ) => light.globalTransformCache.position.elements ).flat(),
        );

        shadingMaterial.addUniformVector(
          'lightColor',
          '3fv',
          lights.map( ( light ) => light.color ).flat(),
        );

        shadingMaterial.addUniformVector(
          'lightParams',
          '4fv',
          lights.map( ( light ) => [ light.spotness, 0.0, 0.0, 0.0 ] ).flat(),
        );

        shadingMaterial.addUniformMatrixVector(
          'lightPV',
          'Matrix4fv',
          lights.map( ( light ) => (
            light.camera.projectionMatrix.multiply(
              light.globalTransformCache.matrix.inverse!
            ).elements
          ) ).flat(),
        );

        shadingMaterial.addUniformTextureArray(
          'samplerShadow',
          lights.map( ( light ) => light.shadowMap.texture ),
        );
      },
      name: process.env.DEV && 'DeferredCamera/shading/setCameraUniforms',
    } );

    for ( let i = 0; i < 4; i ++ ) {
      shadingMaterial.addUniformTexture(
        'sampler' + i,
        this.cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )
      );
    }

    shadingMaterial.addUniformTexture( 'samplerAo', aoTarget.texture );
    shadingMaterial.addUniformTexture( 'samplerIBLLUT', options.textureIBLLUT );
    shadingMaterial.addUniformTexture( 'samplerEnv', options.textureEnv );
    shadingMaterial.addUniformTexture( 'samplerRandom', randomTexture.texture );

    this.components.push(
      camera,
      lambdaAoSetCameraUniforms,
      aoQuad,
      lambda,
      shadingQuad,
    );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/shading.frag', () => {
          shadingMaterial.replaceShader( quadVert, shadingFrag );
        } );
      }
    }
  }
}
