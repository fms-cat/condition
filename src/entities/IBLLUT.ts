import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { IBLLUT_ITER, IBLLUT_SIZE } from '../config';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { Swap } from '@fms-cat/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { vdc } from '../utils/vdc';
import iblLutFrag from '../shaders/ibl-lut.frag';
import quadVert from '../shaders/quad.vert';

export class IBLLUT {
  public entity: Entity;

  public swap: Swap<BufferRenderTarget>;

  public get texture(): GLCatTexture {
    return this.swap.o.texture;
  }

  public constructor() {
    this.entity = new Entity();
    this.entity.visible = false;

    // -- swap -------------------------------------------------------------------------------------
    this.swap = new Swap(
      new BufferRenderTarget( {
        width: IBLLUT_SIZE,
        height: IBLLUT_SIZE,
        name: process.env.DEV && 'IBLLUT/swap0',
        filter: gl.NEAREST,
      } ),
      new BufferRenderTarget( {
        width: IBLLUT_SIZE,
        height: IBLLUT_SIZE,
        name: process.env.DEV && 'IBLLUT/swap1',
        filter: gl.NEAREST,
      } ),
    );

    // -- post -------------------------------------------------------------------------------------
    let samples = 0.0;

    const material = new Material(
      quadVert,
      iblLutFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniform( 'samples', '1f', samples );
    material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
    material.addUniformTexture( 'sampler0', this.swap.i.texture );

    const quad = new Quad( {
      target: this.swap.o,
      material,
      name: process.env.DEV && 'IBLLUT/quad',
    } );

    // -- swapper ----------------------------------------------------------------------------------
    this.entity.components.push( new Lambda( {
      onUpdate: () => {
        samples ++;
        this.swap.swap();

        if ( samples > IBLLUT_ITER ) {
          this.entity.active = false;
        } else {
          material.addUniform( 'samples', '1f', samples );
          material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
          material.addUniformTexture( 'sampler0', this.swap.i.texture );

          quad.target = this.swap.o;
        }
      },
      name: process.env.DEV && 'IBLLUT/swapper',
    } ) );

    this.entity.components.push( quad );
  }
}
