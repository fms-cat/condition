import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { genTorus } from '../geometries/genTorus';
import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material, MaterialMap } from '../heck/Material';
import depthFrag from '../shaders/depth.frag';
import ringsVert from '../shaders/rings.vert';
import ringsFrag from '../shaders/rings.frag';
import { gl, glCat } from '../globals/canvas';
import { Lambda } from '../heck/components/Lambda';

const PRIMCOUNT = 32;

export class Rings {
  public mesh: Mesh;
  public geometry: Geometry;
  public materials: MaterialMap;
  public entity: Entity;

  public constructor() {
    this.entity = new Entity();

    const rot0 = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      0.4,
    ).multiply( Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.4,
    ) );
    this.entity.transform.rotation = rot0;

    this.geometry = this.__createGeometry();
    this.materials = this.__createMaterials();

    this.mesh = new Mesh( {
      geometry: this.geometry,
      materials: this.materials,
      name: process.env.DEV && 'Rings/mesh',
    } );
    this.entity.components.push( this.mesh );

    this.entity.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.entity.transform.rotation = rot0.multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 1.0, 0.0 ] ), time )
        ).multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 1.0, 0.0, 0.0 ] ), 1.0 )
        ).multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 0.0, 1.0 ] ), 1.0 )
        );
      },
      visible: false,
      name: process.env.DEV && 'Cube/speen',
    } ) );
  }

  private __createGeometry(): Geometry {
    const torus = genTorus( { segmentsRadial: 256 } );

    const geometry = new InstancedGeometry();

    geometry.addAttribute( 'position', torus.position );
    geometry.addAttribute( 'normal', torus.normal );
    geometry.setIndex( torus.index );

    const arrayInstanceId = new Array( PRIMCOUNT ).fill( 0 ).map( ( _, i ) => i );
    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( new Float32Array( arrayInstanceId ) );

    geometry.addAttribute( 'instanceId', {
      buffer: bufferInstanceId,
      size: 1,
      divisor: 1,
      type: gl.FLOAT
    } );

    geometry.count = torus.count;
    geometry.primcount = PRIMCOUNT;
    geometry.mode = torus.mode;

    return geometry;
  }

  private __createMaterials(): MaterialMap {
    const forward = new Material(
      ringsVert,
      ringsFrag,
      { defines: { 'FORWARD': 'true' } },
    );

    const deferred = new Material(
      ringsVert,
      ringsFrag,
      { defines: { 'DEFERRED': 'true' } },
    );

    const shadow = new Material( ringsVert, depthFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/rings.vert',
            '../shaders/rings.frag',
          ],
          () => {
            forward.replaceShader( ringsVert, ringsFrag );
            deferred.replaceShader( ringsVert, ringsFrag );
            shadow.replaceShader( ringsVert, depthFrag );
          },
        );
      }
    }

    return { forward, deferred, shadow };
  }
}
