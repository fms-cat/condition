import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import environmentMapFrag from '../shaders/environment-map.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Swap, Xorshift } from '@fms-cat/experimental';
import { Lambda } from '../heck/components/Lambda';

const WIDTH = 1024;
const HEIGHT = 512;

export class EnvironmentMap {
  public entity: Entity;

  public swap: Swap<BufferRenderTarget>;

  public get texture(): GLCatTexture<WebGL2RenderingContext> {
    return this.swap.o.texture;
  }

  public constructor() {
    this.entity = new Entity();
    this.entity.visible = false;

    const rng = new Xorshift( 114514 );

    // -- swap -------------------------------------------------------------------------------------
    this.swap = new Swap(
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

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      environmentMapFrag,
    );
    material.addUniform( 'uniformSeed', '4f', rng.gen(), rng.gen(), rng.gen(), rng.gen() );
    material.addUniformTexture( 'sampler0', this.swap.i.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/environment-map.frag', () => {
          material.replaceShader( quadVert, environmentMapFrag );
        } );
      }
    }

    const quad = new Quad( {
      target: this.swap.o,
      material,
      name: process.env.DEV && 'EnvironmentMap/quad',
    } );

    // -- swapper ----------------------------------------------------------------------------------
    this.entity.components.push( new Lambda( {
      onUpdate: () => {
        this.swap.swap();

        material.addUniform( 'uniformSeed', '4f', rng.gen(), rng.gen(), rng.gen(), rng.gen() );
        material.addUniformTexture( 'sampler0', this.swap.i.texture );

        quad.target = this.swap.o;
      },
      visible: false,
      name: process.env.DEV && 'EnvironmentMap/swapper',
    } ) );

    this.entity.components.push( quad );
  }
}
