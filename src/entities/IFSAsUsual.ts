import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import ifsAsUsualFrag from '../shaders/ifs-as-usual.frag';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

export class IFSAsUsual extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 1.1, 1.1, 1.1 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      raymarchObjectVert,
      ifsAsUsualFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      ifsAsUsualFrag,
      {
        defines: [ 'DEPTH 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/ifs-as-usual.frag', () => {
          deferred.replaceShader( raymarchObjectVert, ifsAsUsualFrag );
          depth.replaceShader( raymarchObjectVert, ifsAsUsualFrag );
        } );
      }
    }

    objectValuesMap( materials, ( material ) => {
      material.addUniformTexture( 'samplerRandom', randomTexture.texture );
      material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    } );

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
        } );
      },
      name: process.env.DEV && 'IFSAsUsual/updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'IFSAsUsual/mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );

    // -- speen ------------------------------------------------------------------------------------
    const axis = new Vector3( [ 1.0, -1.0, 1.0 ] ).normalized;
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = Quaternion.fromAxisAngle( axis, time );
        objectValuesMap( materials, ( material ) => {
          material.addUniform( 'ifsSeed', '1f', auto( 'IFSAsUsual/ifsSeed' ) );
        } );
      },
      name: process.env.DEV && 'IFSAsUsual/update',
    } ) );
  }
}
