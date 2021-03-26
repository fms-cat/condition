import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import cubeVert from '../shaders/cube.vert';
import cubeFrag from '../shaders/cube.frag';
import depthFrag from '../shaders/depth.frag';
import { genCube } from '../geometries/genCube';
import { Lambda } from '../heck/components/Lambda';
import { quadGeometry } from '../globals/quadGeometry';
import { dummyRenderTargetFourDrawBuffers, dummyRenderTarget } from '../globals/dummyRenderTarget';
import { glCat } from '../globals/canvas';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { auto } from '../globals/automaton';

const PRIMCOUNT = 512;

export class Cube extends Entity {
  public mesh: Mesh;

  public constructor() {
    super();

    const rot0 = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      0.4,
    ).multiply( Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.4,
    ) );

    this.transform.position = new Vector3( [ 0.0, 0.0, 0.0 ] );
    this.transform.rotation = rot0;
    this.transform.scale = this.transform.scale.scale( 0.2 );

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube();

    const geometry = new InstancedGeometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindVertexbuffer( cube.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    const arrayInstanceId = [ ...Array( PRIMCOUNT ).keys() ];
    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( new Float32Array( arrayInstanceId ) );
    geometry.vao.bindVertexbuffer( bufferInstanceId, 2, 1, 1 );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;
    geometry.primcount = PRIMCOUNT;

    // -- materials --------------------------------------------------------------------------------
    const materials = {
      deferred: new Material(
        cubeVert,
        cubeFrag,
        {
          defines: { 'DEFERRED': 'true' },
          initOptions: { geometry: quadGeometry, target: dummyRenderTargetFourDrawBuffers },
        },
      ),
      shadow: new Material(
        cubeVert,
        depthFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      ),
    };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/cube.vert',
            '../shaders/cube.frag',
          ],
          () => {
            materials.deferred.replaceShader( cubeVert, cubeFrag );
            materials.shadow.replaceShader( cubeVert, depthFrag );
          },
        );
      }
    }

    // -- updater ----------------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = rot0.multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 1.0, 0.0 ] ), time )
        ).multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 1.0, 0.0, 0.0 ] ), 1.0 )
        ).multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 0.0, 1.0 ] ), 1.0 )
        );

        objectValuesMap( materials, ( material ) => (
          material.addUniform( 'clap', '1f', auto( 'Sync/first/clap' ) )
        ) );
      },
      name: process.env.DEV && 'Cube/speen',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry: geometry,
      materials,
      name: process.env.DEV && 'Cube/mesh',
    } );
    this.components.push( this.mesh );
  }
}
