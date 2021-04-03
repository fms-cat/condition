import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { CubemapRenderTarget } from '../heck/CubemapRenderTarget';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { Swap, Xorshift } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import environmentMapFrag from '../shaders/environment-map.frag';
import environmentMapMergeFrag from '../shaders/environment-map-merge.frag';
import quadVert from '../shaders/quad.vert';

const WIDTH = 1024;
const HEIGHT = 512;

export class EnvironmentMap extends Entity {
  public readonly texture: GLCatTexture;

  public constructor( { cubemap }: {
    cubemap: CubemapRenderTarget;
  } ) {
    super();
    this.visible = false;

    const rng = new Xorshift( 114514 );

    // -- swap -------------------------------------------------------------------------------------
    const swap = new Swap(
      new BufferRenderTarget( {
        width: WIDTH,
        height: HEIGHT,
        name: process.env.DEV && 'EnvironmentMap/swap0',
      } ),
      new BufferRenderTarget( {
        width: WIDTH,
        height: HEIGHT,
        name: process.env.DEV && 'EnvironmentMap/swap1',
      } ),
    );
    swap.i.texture.textureWrap( gl.REPEAT );
    swap.o.texture.textureWrap( gl.REPEAT );

    // -- integrate --------------------------------------------------------------------------------
    swap.swap();

    const materialIntegrate = new Material(
      quadVert,
      environmentMapFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialIntegrate.addUniform( 'uniformSeed', '4f', rng.gen(), rng.gen(), rng.gen(), rng.gen() );
    materialIntegrate.addUniformTexture( 'sampler0', swap.i.texture );
    materialIntegrate.addUniformCubemap( 'samplerCubemap', cubemap.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/environment-map.frag', () => {
          materialIntegrate.replaceShader( quadVert, environmentMapFrag );
        } );
      }
    }

    const quadIntegrate = new Quad( {
      target: swap.o,
      material: materialIntegrate,
      name: process.env.DEV && 'quadIntegrate',
    } );

    // -- merge results ----------------------------------------------------------------------------
    swap.swap();

    const materialMerge = new Material(
      quadVert,
      environmentMapMergeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialMerge.addUniformTexture( 'sampler0', swap.i.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/environment-map-merge.frag', () => {
          materialMerge.replaceShader( quadVert, environmentMapMergeFrag );
        } );
      }
    }

    const quadMerge = new Quad( {
      target: swap.o,
      material: materialMerge,
      name: process.env.DEV && 'quadMerge',
    } );

    // -- this is the output -----------------------------------------------------------------------
    this.texture = swap.o.texture;

    // -- auto -------------------------------------------------------------------------------------
    auto( 'EnvironmentMap/accumulate', ( { value } ) => {
      materialIntegrate.addUniform( 'accumulate', '1f', value );
    } );

    // -- updater ----------------------------------------------------------------------------------
    const lambdaUpdater = new Lambda( {
      onUpdate: () => {
        materialIntegrate.addUniform(
          'uniformSeed',
          '4f',
          rng.gen(),
          rng.gen(),
          rng.gen(),
          rng.gen(),
        );
      },
      name: process.env.DEV && 'lambdaUpdater',
    } );

    // -- components -------------------------------------------------------------------------------
    this.components.push(
      lambdaUpdater,
      quadIntegrate,
      quadMerge,
    );
  }
}
