import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genOctahedron } from '../geometries/genOctahedron';
import { objectValuesMap } from '../utils/objectEntriesMap';
import hooperballFrag from '../shaders/hooperball.frag';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

export class Hooperball extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const octahedron = genOctahedron( { radius: 2.0, div: 1 } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( octahedron.position, 0, 3 );
    geometry.vao.bindIndexbuffer( octahedron.index );

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;
    geometry.indexType = octahedron.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      raymarchObjectVert,
      hooperballFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      hooperballFrag,
      {
        defines: [ 'DEPTH 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/hooperball.frag', () => {
          deferred.replaceShader( raymarchObjectVert, hooperballFrag );
          depth.replaceShader( raymarchObjectVert, hooperballFrag );
        } );
      }
    }

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onDraw: ( event ) => {
        objectValuesMap( materials, ( material ) => {
          material.addUniform(
            'cameraNearFar',
            '2f',
            event.camera.near,
            event.camera.far
          );

          material.addUniformMatrixVector(
            'inversePVM',
            'Matrix4fv',
            event.projectionMatrix
              .multiply( event.viewMatrix )
              .multiply( event.globalTransform.matrix )
              .inverse!
              .elements
          );

          material.addUniform( 'deformSeed', '1f', auto( 'Hooperball/deformSeed' ) );
        } );
      },
      name: process.env.DEV && 'setCameraUniforms',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );
  }
}
