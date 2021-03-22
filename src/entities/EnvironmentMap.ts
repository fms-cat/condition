import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import environmentMapFrag from '../shaders/environment-map.frag';
import environmentMapMergeFrag from '../shaders/environment-map-merge.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Swap, Xorshift } from '@fms-cat/experimental';
import { Lambda } from '../heck/components/Lambda';
import { CubemapRenderTarget } from '../heck/CubemapRenderTarget';
import { gl } from '../globals/canvas';
import { auto } from '../globals/automaton';

const WIDTH = 1024;
const HEIGHT = 512;

export class EnvironmentMap {
  public entity: Entity;

  public readonly texture: GLCatTexture;

  public constructor( { cubemap }: {
    cubemap: CubemapRenderTarget;
  } ) {
    this.entity = new Entity();
    this.entity.visible = false;

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

    this.entity.components.push( new Quad( {
      target: swap.o,
      material: materialIntegrate,
      name: process.env.DEV && 'EnvironmentMap/quadIntegrate',
    } ) );

    // -- merge results ----------------------------------------------------------------------------
    swap.swap();

    const materialMerge = new Material(
      quadVert,
      environmentMapMergeFrag,
    );
    materialMerge.addUniformTexture( 'sampler0', swap.i.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/environment-map-merge.frag', () => {
          materialMerge.replaceShader( quadVert, environmentMapMergeFrag );
        } );
      }
    }

    this.entity.components.push( new Quad( {
      target: swap.o,
      material: materialMerge,
      name: process.env.DEV && 'EnvironmentMap/quadMerge',
    } ) );

    // -- this is the output -----------------------------------------------------------------------
    this.texture = swap.o.texture;

    // -- auto -------------------------------------------------------------------------------------
    auto( 'EnvironmentMap/accumulate', ( { value } ) => {
      materialIntegrate.addUniform( 'accumulate', '1f', value );
    } );

    // -- updater ----------------------------------------------------------------------------------
    this.entity.components.push( new Lambda( {
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
      visible: false,
      name: process.env.DEV && 'EnvironmentMap/updater',
    } ) );
  }
}
