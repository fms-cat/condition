import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { genTorus } from '../geometries/genTorus';
import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import depthFrag from '../shaders/depth.frag';
import ringsVert from '../shaders/rings.vert';
import ringsFrag from '../shaders/rings.frag';
import { gl, glCat } from '../globals/canvas';
import { Lambda } from '../heck/components/Lambda';
import { dummyRenderTargetOneDrawBuffers } from '../globals/dummyRenderTarget';

const PRIMCOUNT = 32;

export class Rings extends Entity {
  public constructor() {
    super();

    const rot0 = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      0.4,
    ).multiply( Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.4,
    ) );
    this.transform.rotation = rot0;

    // -- geometry ---------------------------------------------------------------------------------
    const torus = genTorus( { segmentsRadial: 256 } );

    const geometry = new InstancedGeometry();

    geometry.vao.bindVertexbuffer( torus.position, 0, 3 );
    geometry.vao.bindVertexbuffer( torus.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( torus.index );

    const arrayInstanceId = new Array( PRIMCOUNT ).fill( 0 ).map( ( _, i ) => i );
    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( new Float32Array( arrayInstanceId ) );

    geometry.vao.bindVertexbuffer( bufferInstanceId, 2, 1, 1 );

    geometry.count = torus.count;
    geometry.mode = torus.mode;
    geometry.indexType = torus.indexType;
    geometry.primcount = PRIMCOUNT;

    // -- materials --------------------------------------------------------------------------------
    const materials = {
      forward: new Material(
        ringsVert,
        ringsFrag,
        {
          defines: { 'FORWARD': 'true' },
          initOptions: { geometry, target: dummyRenderTargetOneDrawBuffers },
        },
      ),
      deferred: new Material(
        ringsVert,
        ringsFrag,
        {
          defines: { 'DEFERRED': 'true' },
          initOptions: { geometry, target: dummyRenderTargetOneDrawBuffers },
        },
      ),
      shadow: new Material(
        ringsVert,
        depthFrag,
        { initOptions: { geometry, target: dummyRenderTargetOneDrawBuffers } },
      ),
    }

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/rings.vert',
            '../shaders/rings.frag',
          ],
          () => {
            materials.forward.replaceShader( ringsVert, ringsFrag );
            materials.deferred.replaceShader( ringsVert, ringsFrag );
            materials.shadow.replaceShader( ringsVert, depthFrag );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry: geometry,
      materials: materials,
      name: process.env.DEV && 'Rings/mesh',
    } );
    this.components.push( mesh );

    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = rot0.multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 1.0, 0.0 ] ), time )
        ).multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 1.0, 0.0, 0.0 ] ), 1.0 )
        ).multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 0.0, 1.0 ] ), 1.0 )
        );
      },
      name: process.env.DEV && 'Rings/speen',
    } ) );
  }
}
