import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import bigBlurFrag from '../shaders/big-blur.frag';
import quadVert from '../shaders/quad.vert';

export interface BigBlurOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class BigBlur extends Entity {
  public constructor( options: BigBlurOptions ) {
    super();

    const entityBypass = new Entity();
    entityBypass.visible = false;
    this.children.push( entityBypass );

    const entityMain = new Entity();
    entityMain.active = false;
    entityMain.visible = false;
    this.children.push( entityMain );

    if ( process.env.DEV ) {
      entityBypass.name = 'entityBypass';
      entityMain.name = 'entityMain';
    }

    // -- bypass -----------------------------------------------------------------------------------
    entityBypass.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: process.env.DEV && 'blitBypass',
    } ) );

    // -- h ----------------------------------------------------------------------------------------
    const targetH = new BufferRenderTarget( {
      width: options.target.width,
      height: options.target.height,
      name: process.env.DEV && 'BigBlur/targetH',
    } );

    const materialH = new Material(
      quadVert,
      bigBlurFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialH.addUniformTexture( 'sampler0', options.input.texture );

    if ( module.hot ) {
      module.hot.accept( '../shaders/big-blur.frag', () => {
        materialH.replaceShader( quadVert, bigBlurFrag );
      } );
    }

    const quadH = new Quad( {
      target: targetH,
      material: materialH,
      name: process.env.DEV && 'quadH',
    } );
    entityMain.components.push( quadH );

    // -- h ----------------------------------------------------------------------------------------
    const materialV = new Material(
      quadVert,
      bigBlurFrag,
      {
        defines: [ 'IS_VERTICAL 1' ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget }
      },
    );
    materialV.addUniformTexture( 'sampler0', targetH.texture );

    if ( module.hot ) {
      module.hot.accept( '../shaders/big-blur.frag', () => {
        materialV.replaceShader( quadVert, bigBlurFrag );
      } );
    }

    const quadV = new Quad( {
      target: options.target,
      material: materialV,
      name: process.env.DEV && 'quadV',
    } );
    entityMain.components.push( quadV );

    // -- update uniform ---------------------------------------------------------------------------
    auto( 'BigBlur/amp', ( { value } ) => {
      materialH.addUniform( 'ratio', '1f', Math.min( 1.0, 100.0 * value ) );
      materialH.addUniform( 'sigma', '1f', 100.0 * value );
      materialV.addUniform( 'ratio', '1f', Math.min( 1.0, 100.0 * value ) );
      materialV.addUniform( 'sigma', '1f', 100.0 * value );

      entityMain.active = 0.0 < value;
      entityBypass.active = !entityMain.active;
    } );
  }
}
