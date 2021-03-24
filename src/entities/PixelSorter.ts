import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import pixelSorterIndexFrag from '../shaders/pixel-sorter-index.frag';
import pixelSorterFrag from '../shaders/pixel-sorter.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Swap } from '@fms-cat/experimental';
import { Blit } from '../heck/components/Blit';
import { auto } from '../globals/automaton';
import { quadGeometry } from '../globals/quadGeometry';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';

export interface PixelSorterOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class PixelSorter extends Entity {
  public swapBuffer: Swap<BufferRenderTarget>;

  public constructor( options: PixelSorterOptions ) {
    super();
    this.visible = false;

    const entityBypass = new Entity();
    entityBypass.visible = false;
    this.children.push( entityBypass );

    const entityMain = new Entity();
    entityMain.active = false;
    entityMain.visible = false;
    this.children.push( entityMain );

    this.swapBuffer = new Swap(
      new BufferRenderTarget( {
        width: options.target.width,
        height: options.target.height,
        name: process.env.DEV && 'PixelSorter/swap0',
      } ),
      new BufferRenderTarget( {
        width: options.target.width,
        height: options.target.height,
        name: process.env.DEV && 'PixelSorter/swap1',
      } ),
    );

    const bufferIndex = new BufferRenderTarget( {
      width: options.target.width,
      height: options.target.height,
      name: process.env.DEV && 'PixelSorter/index',
    } );

    // -- bypass -----------------------------------------------------------------------------------
    entityBypass.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: 'PixelSorter/blitBypass',
    } ) );

    // -- calc index -------------------------------------------------------------------------------
    let mul = 1;
    const indexMaterials: Material[] = [];

    while ( mul < options.target.width ) {
      const isLast = ( mul * 8 > options.target.width );

      const material = new Material(
        quadVert,
        pixelSorterIndexFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      );
      material.addUniform( 'mul', '1f', mul );
      material.addUniformTexture(
        'sampler0',
        options.input.texture,
      );
      material.addUniformTexture(
        'sampler1',
        this.swapBuffer.o.texture,
      );
      indexMaterials.push( material );

      entityMain.components.push( new Quad( {
        target: isLast ? bufferIndex : this.swapBuffer.i,
        material,
        name: process.env.DEV && `PixelSorter/quadIndex-${ mul }`,
      } ) );

      this.swapBuffer.swap();

      mul *= 8;
    }

    // -- sort -------------------------------------------------------------------------------------
    let dir = 1.0 / 32.0;
    let comp = 1.0 / 32.0;

    while ( dir < 1.0 ) {
      const isFirst = dir === 1.0 / 32.0;
      const isLast = ( dir === 0.5 ) && ( comp === 1.0 / 32.0 );

      const material = new Material(
        quadVert,
        pixelSorterFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      );
      material.addUniform( 'dir', '1f', dir );
      material.addUniform( 'comp', '1f', comp );
      material.addUniformTexture(
        'sampler0',
        ( isFirst ? options.input : this.swapBuffer.o ).texture,
      );
      material.addUniformTexture(
        'sampler1',
        bufferIndex.texture,
      );

      entityMain.components.push( new Quad( {
        target: isLast ? options.target : this.swapBuffer.i,
        material,
        name: process.env.DEV && `PixelSorter/quad-${ dir }-${ comp }`,
      } ) );

      this.swapBuffer.swap();

      if ( comp === 1.0 / 32.0 ) {
        dir *= 2.0;
        comp = dir;
      } else {
        comp /= 2.0;
      }
    }

    // -- update uniform ---------------------------------------------------------------------------
    auto( 'PixelSorter/amp', ( { value } ) => {
      indexMaterials.map( ( material ) => {
        material.addUniform( 'threshold', '1f', value );
      } );

      entityMain.active = 0.001 < value;
      entityBypass.active = !entityMain.active;
    } );
  }
}
