import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import quadVert from '../shaders/quad.vert';
import textOverlayFrag from '../shaders/text-overlay.frag';

export interface TextOverlayOptions {
  target: RenderTarget;
}

export class TextOverlay extends Entity {
  public constructor( options: TextOverlayOptions ) {
    super();

    // -- create cards -----------------------------------------------------------------------------
    const canvasText = document.createElement( 'canvas' );
    const width = canvasText.width = options.target.width;
    const height = canvasText.height = options.target.height;

    const context = canvasText.getContext( '2d' )!;
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `100 ${ 0.02 * width }px Bahnschrift, sans-serif`;

    const heck = ( texture: GLCatTexture, text: string ): GLCatTexture => {
      context.clearRect( 0, 0, width, height );
      context.fillText( text, width / 2.0, height / 2.0 );
      texture.setTexture( canvasText );
      return texture;
    };

    const textures = [
      heck( glCat.createTexture(), 'Revision 2021' ),
      heck( glCat.createTexture(), 'A 64k WebGL intro' ),
      glCat.createTexture(),
      glCat.createTexture(),
    ];

    {
      context.clearRect( 0, 0, width, height );
      context.fillText( 'Code, Graphics, Music', 0.5 * width, 0.47 * height );
      context.font = `100 ${ 0.03 * width }px Bahnschrift, sans-serif`;
      context.fillText( 'FMS_Cat', 0.5 * width, 0.52 * height );
      context.font = `100 ${ 0.02 * width }px Bahnschrift, sans-serif`;

      textures[ 2 ].setTexture( canvasText );
    }

    {
      context.clearRect( 0, 0, width, height );
      context.fillText( 'I promise I will hire a', 0.5 * width, 0.48 * height );
      context.fillText( 'graphic direction guy next time', 0.5 * width, 0.52 * height );

      context.textAlign = 'right';
      context.fillText( 'Press Esc to exit the experience', 0.9 * width, 0.91 * height );

      context.textAlign = 'left';
      context.fillText( 'by FMS_Cat', 0.28 * width, 0.85 * height );
      context.fillText( 'A 64K WebGL Intro @ Revision 2021', 0.1 * width, 0.91 * height );
      context.font = `100 ${ 0.04 * width }px Bahnschrift, sans-serif`;
      context.fillText( 'Condition', 0.1 * width, 0.84 * height );

      textures[ 3 ].setTexture( canvasText );
    }

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      textOverlayFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );
    material.addUniformTexture( 'sampler0', textures[ 0 ] );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/text-overlay.frag', () => {
          material.replaceShader( quadVert, textOverlayFrag );
        } );
      }
    }

    const quad = new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'quad',
    } );
    this.components.push( quad );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'TextOverlay/texture', ( { value } ) => {
      material.addUniformTexture( 'sampler0', textures[ value ] );
    } );

    auto( 'TextOverlay/amp', ( { value } ) => {
      material.addUniform( 'amp', '1f', value );
    } );
  }
}
