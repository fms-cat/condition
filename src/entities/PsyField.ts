import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { LightEntity } from './LightEntity';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectValuesMap } from '../utils/objectEntriesMap';
import psyFieldFrag from '../shaders/psy-field.frag';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

export class PsyField extends Entity {
  public lights: LightEntity[] = [];

  public constructor() {
    super();

    this.transform.position = new Vector3( [ 0.0, 0.0, 0.0 ] );
    this.transform.scale = new Vector3( [ 1.0, 1.0, 1.0 ] );

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 100.0, 1.0, 100.0 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    // const forward = new Material(
    //   raymarchObjectVert,
    //   psyFieldFrag,
    //   {
    //     defines: [ 'FORWARD 1' ],
    //     initOptions: { geometry, target: dummyRenderTarget },
    //   },
    // );

    const deferred = new Material(
      raymarchObjectVert,
      psyFieldFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      psyFieldFrag,
      {
        defines: [ 'DEPTH 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/psy-field.frag', () => {
          // forward.replaceShader( raymarchObjectVert, psyFieldFrag );
          deferred.replaceShader( raymarchObjectVert, psyFieldFrag );
          depth.replaceShader( raymarchObjectVert, psyFieldFrag );
        } );
      }
    }

    // -- forward lights ---------------------------------------------------------------------------
    // this.components.push( new Lambda( {
    //   onDraw: ( { frameCount } ) => {
    //     setLightUniforms( forward, this.lights, frameCount );
    //   },
    //   name: process.env.DEV && 'setLightUniforms',
    // } ) );

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
