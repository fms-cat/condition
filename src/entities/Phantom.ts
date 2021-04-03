import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import phantomFrag from '../shaders/phantom.frag';
import quadVert from '../shaders/quad.vert';

export class Phantom extends Entity {
  private __forward: Material;

  public constructor() {
    super();

    // -- material ---------------------------------------------------------------------------------
    const forward = this.__forward = new Material(
      quadVert,
      phantomFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      }
    );

    forward.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );
    forward.addUniformTexture( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV && module.hot ) {
      module.hot.accept( [ '../shaders/phantom.frag' ], () => {
        forward.replaceShader( quadVert, phantomFrag );
      } );
    }

    const materials = { forward, cubemap: forward };

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onDraw: ( event ) => {
        forward.addUniformMatrixVector(
          'inversePVM',
          'Matrix4fv',
          event.projectionMatrix
            .multiply( event.viewMatrix )
            .multiply( event.globalTransform.matrix )
            .inverse!
            .elements
        );
      },
      name: process.env.DEV && 'updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry: quadGeometry,
      materials,
    } );
    mesh.depthTest = false;
    mesh.depthWrite = false;
    this.components.push( mesh );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Phantom/amp', ( { value } ) => {
      forward.addUniform( 'amp', '1f', value );

      mesh.active = value > 0.0;
      mesh.visible = mesh.active;
    } );
  }

  /**
   * どうやってフレームバッファのデプスを取るかわかりませんでした 許してほしい
   */
  public setDefferedCameraTarget( deferredCameraTarget: BufferRenderTarget ): void {
    this.__forward.addUniformTexture( 'samplerDeferred0', deferredCameraTarget.texture );
  }
}
