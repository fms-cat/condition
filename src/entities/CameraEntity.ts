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

export interface CameraEntityOptions {
  root: Entity;
  target: RenderTarget;
  lights: LightEntity[];
  textureIBLLUT: GLCatTexture;
  textureEnv: GLCatTexture;
}

export class CameraEntity extends Entity {
  public root: Entity;
  public camera: PerspectiveCamera;

  public constructor( options: CameraEntityOptions ) {
    super();

    this.root = options.root;

    const cameraTarget = new BufferRenderTarget( {
      width: options.target.width,
      height: options.target.height,
      numBuffers: 4,
      name: 'CameraEntity/cameraTarget',
    } );

    this.camera = new PerspectiveCamera( {
      scene: this.root,
      renderTarget: cameraTarget,
      near: 0.1,
      far: 20.0,
      name: 'CameraEntity/camera',
      materialTag: 'deferred',
    } );

    const aoTarget = new BufferRenderTarget( {
      width: AO_RESOLUTION_RATIO * options.target.width,
      height: AO_RESOLUTION_RATIO * options.target.height,
      name: 'CameraEntity/aoTarget',
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
          this.camera.projectionMatrix.multiply(
            cameraView
          ).elements
        );
      },
      name: process.env.DEV && 'CameraEntity/ao/setCameraUniforms',
    } );

    for ( let i = 0; i < 2; i ++ ) { // it doesn't need 2 and 3
      aoMaterial.addUniformTexture(
        'sampler' + i,
        cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )
      );
    }

    aoMaterial.addUniformTexture( 'samplerRandom', randomTexture.texture );

    const aoQuad = new Quad( {
      material: aoMaterial,
      target: aoTarget,
      name: process.env.DEV && 'CameraEntity/ao/quad',
    } );

    const shadingMaterials = options.lights.map( ( light, iLight ) => {
      const shadingMaterial = new Material(
        quadVert,
        shadingFrag,
        {
          defines: iLight === 0 ? [ 'IS_FIRST_LIGHT' ] : [],
          initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
        },
      );

      const shadingQuad = new Quad( {
        material: shadingMaterial,
        target: options.target,
        name: process.env.DEV && 'CameraEntity/shading/quad',
      } );
      shadingQuad.clear = iLight === 0 ? [] : false;

      const lambda = new Lambda( {
        onUpdate: ( { frameCount } ) => {
          const lightHasUpdated = frameCount === light.lastUpdateFrame;
          shadingQuad.active = lightHasUpdated;
          if ( !lightHasUpdated ) {
            return;
          }

          const cameraView = this.transform.matrix.inverse!;

          shadingMaterial.addUniformMatrixVector(
            'cameraView',
            'Matrix4fv',
            cameraView.elements
          );

          shadingMaterial.addUniformMatrixVector(
            'cameraPV',
            'Matrix4fv',
            this.camera.projectionMatrix.multiply(
              cameraView
            ).elements
          );

          shadingMaterial.addUniform(
            'lightNearFar',
            '2f',
            light.camera.near,
            light.camera.far
          );

          shadingMaterial.addUniform(
            'cameraNearFar',
            '2f',
            this.camera.near,
            this.camera.far
          );

          shadingMaterial.addUniform(
            'cameraPos',
            '3f',
            ...this.transform.position.elements
          );

          shadingMaterial.addUniform(
            'lightPos',
            '3f',
            ...light.transform.position.elements
          );

          shadingMaterial.addUniform(
            'lightColor',
            '3f',
            ...light.color
          );

          shadingMaterial.addUniformMatrixVector(
            'lightPV',
            'Matrix4fv',
            light.camera.projectionMatrix.multiply(
              light.transform.matrix.inverse!
            ).elements
          );
        },
        name: process.env.DEV && 'CameraEntity/shading/setCameraUniforms',
      } );

      for ( let i = 0; i < 4; i ++ ) {
        shadingMaterial.addUniformTexture(
          'sampler' + i,
          cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )
        );
      }

      shadingMaterial.blend = [ gl.ONE, gl.ONE ];
      shadingMaterial.addUniformTexture( 'samplerAo', aoTarget.texture );
      shadingMaterial.addUniformTexture( 'samplerShadow', light.shadowMap.texture );
      shadingMaterial.addUniformTexture( 'samplerIBLLUT', options.textureIBLLUT );
      shadingMaterial.addUniformTexture( 'samplerEnv', options.textureEnv );
      shadingMaterial.addUniformTexture( 'samplerRandom', randomTexture.texture );

      this.components.push(
        this.camera,
        lambdaAoSetCameraUniforms,
        aoQuad,
        lambda,
        shadingQuad,
      );

      return shadingMaterial;
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/shading.frag', () => {
          shadingMaterials.forEach( ( material ) => {
            material.replaceShader( quadVert, shadingFrag );
          } );
        } );
      }
    }
  }
}
