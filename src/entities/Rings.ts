import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { genTorus } from '../geometries/genTorus';
import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import ringsVert from '../shaders/rings.vert';
import ringsFrag from '../shaders/rings.frag';
import { gl, glCat } from '../globals/canvas';

const PRIMCOUNT = 32;

export class Rings {
  public mesh: Mesh;
  public geometry: Geometry;
  public material: Material;
  public entity: Entity;

  public constructor() {
    this.entity = new Entity();

    this.entity.transform.rotation = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      0.4,
    ).multiply( Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.4,
    ) );

    this.geometry = this.__createGeometry();
    this.material = this.__createMaterial();

    this.mesh = new Mesh( {
      geometry: this.geometry,
      material: this.material,
      name: process.env.DEV && 'Rings/mesh',
    } );
    this.entity.components.push( this.mesh );
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

  private __createMaterial(): Material {
    const material = new Material( ringsVert, ringsFrag );

    material.addUniform( 'inflate', '1f', 0.01 );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/rings.vert',
            '../shaders/rings.frag',
          ],
          () => {
            material.replaceShader( ringsVert, ringsFrag );
          },
        );
      }
    }

    return material;
  }
}
