import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genTorus } from '../geometries/genTorus';
import chaosTorusFrag from '../shaders/chaos-torus.frag';
import chaosTorusVert from '../shaders/chaos-torus.vert';
import depthFrag from '../shaders/depth.frag';

export class ChaosTorus extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const torus = genTorus( { segmentsRadial: 64, segmentsTubular: 8 } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( torus.position, 0, 3 );
    geometry.vao.bindVertexbuffer( torus.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( torus.index );

    geometry.count = torus.count;
    geometry.mode = torus.mode;
    geometry.indexType = torus.indexType;

    // -- materials --------------------------------------------------------------------------------
    const cubemap = new Material(
      chaosTorusVert,
      chaosTorusFrag,
      {
        defines: [ 'FORWARD 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const deferred = new Material(
      chaosTorusVert,
      chaosTorusFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const depth = new Material(
      chaosTorusVert,
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
            '../shaders/chaos-torus.vert',
            '../shaders/chaos-torus.frag',
          ],
          () => {
            cubemap.replaceShader( chaosTorusVert, chaosTorusFrag );
            deferred.replaceShader( chaosTorusVert, chaosTorusFrag );
            depth.replaceShader( chaosTorusVert, depthFrag );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'ChaosTorus/mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );
  }
}
