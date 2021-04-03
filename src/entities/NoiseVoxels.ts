import { Entity } from '../heck/Entity';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quaternion, Vector3, matrix3d } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { glCat } from '../globals/canvas';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { quadGeometry } from '../globals/quadGeometry';
import depthFrag from '../shaders/depth.frag';
import noiseVoxelsFrag from '../shaders/noise-voxels.frag';
import noiseVoxelsVert from '../shaders/noise-voxels.vert';

const CUBE_PER_AXIS = 8;
const PRIMCOUNT = CUBE_PER_AXIS * CUBE_PER_AXIS * CUBE_PER_AXIS;

export class NoiseVoxels extends Entity {
  public mesh: Mesh;

  public constructor() {
    super();

    this.transform.scale = Vector3.one.scale( 0.7 );

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = Quaternion.fromAxisAngle(
          new Vector3( [ 1.0, 0.5, -2.0 ] ).normalized,
          0.4 * time,
        ).multiply( Quaternion.fromAxisAngle(
          new Vector3( [ 0.0, 1.0, 0.2 ] ).normalized,
          time,
        ) );
      },
    } ) );

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube();

    const geometry = new InstancedGeometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindVertexbuffer( cube.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    const arrayInstancePos = matrix3d( CUBE_PER_AXIS, CUBE_PER_AXIS, CUBE_PER_AXIS );
    const bufferInstancePos = glCat.createBuffer();
    bufferInstancePos.setVertexbuffer( new Float32Array( arrayInstancePos ) );
    geometry.vao.bindVertexbuffer( bufferInstancePos, 2, 3, 1 );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;
    geometry.primcount = PRIMCOUNT;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      noiseVoxelsVert,
      noiseVoxelsFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      noiseVoxelsVert,
      depthFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/noise-voxels.vert',
            '../shaders/noise-voxels.frag',
          ],
          () => {
            deferred.replaceShader( noiseVoxelsVert, noiseVoxelsFrag );
            depth.replaceShader( noiseVoxelsVert, depthFrag );
          },
        );
      }
    }

    // -- auto -------------------------------------------------------------------------------------
    auto( 'NoiseVoxels/phase', ( { value } ) => {
      objectValuesMap( materials, ( material ) => {
        material.addUniform( 'phase', '1f', value );
      } );
    } );

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry: geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    this.components.push( this.mesh );
  }
}
