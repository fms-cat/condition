import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { DeferredCamera } from './DeferredCamera';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import quadVert from '../shaders/quad.vert';
import ssrFrag from '../shaders/ssr.frag';

export interface SSROptions {
  camera: DeferredCamera;
  shaded: BufferRenderTarget;
  target: RenderTarget;
}

export class SSR extends Entity {
  public constructor( options: SSROptions ) {
    super();

    const entityBypass = new Entity();
    entityBypass.visible = false;
    this.children.push( entityBypass );

    const entityMain = new Entity();
    entityMain.active = false;
    entityMain.visible = false;
    this.children.push( entityMain );

    // -- bypass -----------------------------------------------------------------------------------
    entityBypass.components.push( new Blit( {
      src: options.shaded,
      dst: options.target,
      name: 'SSR/blitBypass',
    } ) );

    // -- ha ---------------------------------------------------------------------------------------
    const { camera } = options;

    const material = new Material(
      quadVert,
      ssrFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );

    material.addUniformTexture( 'samplerRandom', randomTexture.texture );

    for ( let i = 0; i < 4; i ++ ) {
      material.addUniformTexture(
        'sampler' + i,
        options.camera.cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )
      );
    }

    material.addUniformTexture( 'samplerShaded', options.shaded.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/ssr.frag', () => {
          material.replaceShader( quadVert, ssrFrag );
        } );
      }
    }

    // -- camera uniforms --------------------------------------------------------------------------
    const lambda = new Lambda( {
      onUpdate: () => {
        const cameraView = camera.transform.matrix.inverse!;

        material.addUniformMatrixVector(
          'cameraView',
          'Matrix4fv',
          cameraView.elements
        );

        material.addUniformMatrixVector(
          'cameraPV',
          'Matrix4fv',
          camera.camera.projectionMatrix.multiply(
            cameraView
          ).elements
        );

        material.addUniform(
          'cameraNearFar',
          '2f',
          camera.camera.near,
          camera.camera.far
        );

        material.addUniform(
          'cameraPos',
          '3f',
          ...camera.transform.position.elements
        );
      },
      name: process.env.DEV && 'SSR/shading/setCameraUniforms',
    } );
    entityMain.components.push( lambda );

    // -- quad -------------------------------------------------------------------------------------
    const quad = new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'SSR/quad',
    } );
    entityMain.components.push( quad );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'SSR/active', ( { uninit } ) => {
      entityMain.active = !uninit;
      entityBypass.active = !entityMain.active;
    } );
  }
}
