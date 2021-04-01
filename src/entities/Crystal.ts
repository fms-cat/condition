import { BeamCharge } from './BeamCharge';
import { BeamRing } from './BeamRing';
import { BeamShot } from './BeamShot';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectValuesMap } from '../utils/objectEntriesMap';
import crystalFrag from '../shaders/crystal.frag';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

interface CrystalOptions {
  width: number;
  height: number;
  noiseOffset: number;
}

export class Crystal extends Entity {
  public constructor( { width, height, noiseOffset }: CrystalOptions ) {
    super();

    this.transform.position = new Vector3( [ 0.0, 0.0, 0.0 ] );
    this.transform.scale = new Vector3( [ 1.0, 1.0, 1.0 ] );

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ width, height, width ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      raymarchObjectVert,
      crystalFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    // I don't think we need this
    // const depth = new Material(
    //   raymarchObjectVert,
    //   crystalFrag,
    //   {
    //     defines: [ 'DEPTH 1' ],
    //     initOptions: { geometry, target: dummyRenderTarget }
    //   },
    // );

    const materials = { deferred };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/crystal.frag', () => {
          deferred.replaceShader( raymarchObjectVert, crystalFrag );
          // depth.replaceShader( raymarchObjectVert, crystalFrag );
        } );
      }
    }

    objectValuesMap( materials, ( material ) => {
      material.addUniform( 'size', '2f', width, height );
      material.addUniform( 'noiseOffset', '1f', noiseOffset );
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
      name: process.env.DEV && 'Crystal/updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'Crystal/mesh',
    } );
    mesh.cull = MeshCull.None;
    this.components.push( mesh );

    // -- beam -------------------------------------------------------------------------------------
    const beamCharge = new BeamCharge();
    beamCharge.transform.position = new Vector3( [ 0.0, 1.8, 0.0 ] );

    const beamShot = new BeamShot( { length: 100.0 } );
    beamShot.transform.position = new Vector3( [ 0.0, 1.8, 0.0 ] );

    const beamRing = new BeamRing();
    beamRing.transform.position = new Vector3( [ 0.0, 1.8, 0.0 ] );

    auto( 'Crystal/beam/charge', ( { value } ) => {
      beamCharge.setRadius( value );
    } );

    auto( 'Crystal/beam/ring', ( { value } ) => {
      beamRing.setRadius( value );
    } );

    auto( 'Crystal/beam/shot', ( { value } ) => {
      beamShot.setWidth( value );
    } );

    this.children.push( beamCharge, beamShot, beamRing );
  }
}
