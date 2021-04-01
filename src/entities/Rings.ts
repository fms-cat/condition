import { Entity } from '../heck/Entity';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genTorus } from '../geometries/genTorus';
import { glCat } from '../globals/canvas';
import { objectValuesMap } from '../utils/objectEntriesMap';
import depthFrag from '../shaders/depth.frag';
import ringsFrag from '../shaders/rings.frag';
import ringsVert from '../shaders/rings.vert';

const PRIMCOUNT = 32;

export class Rings extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const torus = genTorus( { segmentsRadial: 256 } );

    const geometry = new InstancedGeometry();

    geometry.vao.bindVertexbuffer( torus.position, 0, 3 );
    geometry.vao.bindVertexbuffer( torus.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( torus.index );

    const arrayInstanceId = [ ...Array( PRIMCOUNT ).keys() ];
    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( new Float32Array( arrayInstanceId ) );

    geometry.vao.bindVertexbuffer( bufferInstanceId, 2, 1, 1 );

    geometry.count = torus.count;
    geometry.mode = torus.mode;
    geometry.indexType = torus.indexType;
    geometry.primcount = PRIMCOUNT;

    // -- materials --------------------------------------------------------------------------------
    const cubemap = new Material(
      ringsVert,
      ringsFrag,
      {
        defines: [ 'FORWARD 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const deferred = new Material(
      ringsVert,
      ringsFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const depth = new Material(
      ringsVert,
      depthFrag,
      { initOptions: { geometry, target: dummyRenderTarget } },
    );

    const materials = {
      cubemap,
      deferred,
      depth,
    };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/rings.vert',
            '../shaders/rings.frag',
          ],
          () => {
            cubemap.replaceShader( ringsVert, ringsFrag );
            deferred.replaceShader( ringsVert, ringsFrag );
            depth.replaceShader( ringsVert, depthFrag );
          },
        );
      }
    }

    // -- begin ------------------------------------------------------------------------------------
    auto( 'Rings/begin', ( { value } ) => {
      objectValuesMap( materials, ( material ) => {
        material.addUniform( 'begin', '1f', value );
      } );
    } );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'Rings/mesh',
    } );
    this.components.push( mesh );
  }
}
