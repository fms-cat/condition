import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material, MaterialMap } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import sufferTextsComputeFrag from '../shaders/suffer-texts-compute.frag';
import sufferTextsRenderFrag from '../shaders/suffer-texts-render.frag';
import sufferTextsRenderVert from '../shaders/suffer-texts-render.vert';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { gl, glCat } from '../globals/canvas';
import { randomTextureStatic } from '../globals/randomTexture';
import { tinyCharTexture } from '../globals/tinyCharTexture';
import { Lambda } from '../heck/components/Lambda';
import { auto } from '../globals/automaton';
import { sufferList } from '../sufferList';

const PARTICLES = 256;

export class SufferTexts {
  public get entity(): Entity {
    return this.gpuParticles.entity;
  }

  public gpuParticles: GPUParticles;
  public queue: number[][];
  public particleIndex: number;

  public constructor() {
    this.gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute(),
      geometryRender: this.__createGeometryRender(),
      materialsRender: this.__createMaterialsRender(),
      computeWidth: PARTICLES,
      computeHeight: 1,
      computeNumBuffers: 1,
      namePrefix: process.env.DEV && 'SufferTexts',
    } );

    this.queue = [];

    this.particleIndex = 0;

    auto( 'sufferText/push', ( { value } ) => {
      const suffer = sufferList[ Math.floor( value ) ].split( '\n' );
      suffer.forEach( ( line, iLine ) => {
        const chars = [ ...line ];
        this.queue.push( ...chars.map( ( char, iChar ) => [
          iChar - 0.5 * ( chars.length - 1 ),
          iLine - 0.5 * ( suffer.length - 1 ),
          char.charCodeAt( 0 ),
        ] ) );
      } );
    } );

    this.entity.components.push( new Lambda( {
      onUpdate: () => {
        const val = this.queue.shift();
        if ( val != null ) {
          const x = ( this.particleIndex + 0.5 ) / PARTICLES;
          this.gpuParticles.materialCompute.addUniform( 'logInit', '4f', ...val, x );
          this.particleIndex = ( this.particleIndex + 1 ) % PARTICLES;
        } else {
          this.gpuParticles.materialCompute.addUniform( 'logInit', '4f', 0.0, 0.0, 0.0, 0.0 );
        }
      },
    } ) );
  }

  private __createMaterialCompute(): Material {
    const material = new Material( quadVert, sufferTextsComputeFrag );
    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/suffer-texts-compute.frag', () => {
          material.replaceShader( quadVert, sufferTextsComputeFrag );
        } );
      }
    }

    return material;
  }

  private __createGeometryRender(): Geometry {
    const geometry = new InstancedGeometry();

    const bufferP = glCat.createBuffer();
    bufferP.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    geometry.addAttribute( 'position', {
      buffer: bufferP,
      size: 2,
      type: gl.FLOAT,
    } );

    const bufferComputeUV = glCat.createBuffer();
    bufferComputeUV.setVertexbuffer( ( () => {
      const ret = new Float32Array( PARTICLES );
      for ( let ix = 0; ix < PARTICLES; ix ++ ) {
        const s = ( ix + 0.5 ) / PARTICLES;
        ret[ ix ] = s;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeX', {
      buffer: bufferComputeUV,
      size: 1,
      divisor: 1,
      type: gl.FLOAT
    } );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;
    geometry.primcount = PARTICLES;

    return geometry;
  }

  private __createMaterialsRender(): MaterialMap<'deferred'> {
    const deferred = new Material(
      sufferTextsRenderVert,
      sufferTextsRenderFrag,
      { defines: { 'DEFERRED': 'true' } },
    );
    deferred.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    deferred.addUniformTexture( 'samplerTinyChar', tinyCharTexture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/suffer-texts-render.vert',
            '../shaders/suffer-texts-render.frag',
          ],
          () => {
            deferred.replaceShader( sufferTextsRenderVert, sufferTextsRenderFrag );
          }
        );
      }
    }

    return { deferred };
  }
}
