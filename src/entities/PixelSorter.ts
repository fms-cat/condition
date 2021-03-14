import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import pixelSorterIndexFrag from '../shaders/pixel-sorter-index.frag';
import pixelSorterFrag from '../shaders/pixel-sorter.frag';
import quadVert from '../shaders/quad.vert';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Swap } from '@fms-cat/experimental';
import { DISPLAY } from '../heck/DISPLAY';
import { Automaton } from '@fms-cat/automaton';

export interface PixelSorterOptions {
  input: GLCatTexture<WebGL2RenderingContext>;
  target: RenderTarget;
  automaton: Automaton;
}

export class PixelSorter {
  public entity: Entity;
  public swapBuffer: Swap<BufferRenderTarget>;

  public constructor( options: PixelSorterOptions ) {
    const { gl } = DISPLAY;

    this.entity = new Entity();
    this.entity.visible = false;

    this.swapBuffer = new Swap(
      new BufferRenderTarget( {
        width: options.target.width,
        height: options.target.height,
        numBuffers: 2,
        name: process.env.DEV && 'PixelSorter/swap0',
      } ),
      new BufferRenderTarget( {
        width: options.target.width,
        height: options.target.height,
        numBuffers: 2,
        name: process.env.DEV && 'PixelSorter/swap1',
      } ),
    );

    // -- calc index -------------------------------------------------------------------------------
    let mul = 1;
    const indexMaterials: Material[] = [];

    while ( mul < options.target.width ) {
      const isFirst = mul === 1;

      const material = new Material(
        quadVert,
        pixelSorterIndexFrag,
      );
      material.addUniform( 'mul', '1f', mul );
      material.addUniformTexture(
        'sampler0',
        isFirst ? options.input : this.swapBuffer.o.getTexture( gl.COLOR_ATTACHMENT0 ),
      );
      material.addUniformTexture(
        'sampler1',
        this.swapBuffer.o.getTexture( gl.COLOR_ATTACHMENT1 ),
      );
      indexMaterials.push( material );

      this.entity.components.push( new Quad( {
        target: this.swapBuffer.i,
        material,
        name: process.env.DEV && `PixelSorter/quadIndex-${ mul }`,
      } ) );

      this.swapBuffer.swap();

      mul *= 8;
    }

    // -- sort -------------------------------------------------------------------------------------
    let dir = 1.0 / 64.0;
    let comp = 1.0 / 64.0;

    while ( dir < 1.0 ) {
      const isLast = ( dir === 0.5 ) && ( comp === 1.0 / 64.0 );

      const material = new Material(
        quadVert,
        pixelSorterFrag,
      );
      material.addUniform( 'dir', '1f', dir );
      material.addUniform( 'comp', '1f', comp );
      material.addUniformTexture(
        'sampler0',
        this.swapBuffer.o.getTexture( gl.COLOR_ATTACHMENT0 ),
      );
      material.addUniformTexture(
        'sampler1',
        this.swapBuffer.o.getTexture( gl.COLOR_ATTACHMENT1 ),
      );

      this.entity.components.push( new Quad( {
        target: isLast ? options.target : this.swapBuffer.i,
        material,
        name: process.env.DEV && `PixelSorter/quad-${ dir }-${ comp }`,
      } ) );

      this.swapBuffer.swap();

      if ( comp === 1.0 / 64.0 ) {
        dir *= 2.0;
        comp = dir;
      } else {
        comp /= 2.0;
      }
    }

    // -- update uniform ---------------------------------------------------------------------------
    options.automaton.auto( 'PixelSorter/amp', ( { value } ) => {
      indexMaterials.map( ( material ) => {
        material.addUniform( 'threshold', '1f', value );
      } );

      this.entity.active = 0.0 < value;
    } );
  }
}
