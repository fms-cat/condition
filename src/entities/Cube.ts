import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material, MaterialMap } from '../heck/Material';
import cubeVert from '../shaders/cube.vert';
import cubeFrag from '../shaders/cube.frag';
import depthFrag from '../shaders/depth.frag';
import { genCube } from '../geometries/genCube';
import { Lambda } from '../heck/components/Lambda';
import { gl } from '../globals/canvas';

export class Cube {
  public mesh: Mesh;
  public geometry: Geometry;
  public materials: MaterialMap<'deferred' | 'shadow'>;
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

    this.entity.transform.position = new Vector3( [ 0.0, 0.0, -2.0 ] );
    this.entity.transform.rotation = rot0;
    this.entity.transform.scale = this.entity.transform.scale.scale( 0.8 );

    this.geometry = this.__createGeometry();
    this.materials = this.__createMaterials();

    this.mesh = new Mesh( {
      geometry: this.geometry,
      materials: this.materials,
      name: process.env.DEV && 'Cube/mesh',
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
    const cube = genCube();

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindVertexbuffer( cube.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = gl.UNSIGNED_SHORT;

    return geometry;
  }

  private __createMaterials(): MaterialMap<'deferred' | 'shadow'> {
    const deferred = new Material(
      cubeVert,
      cubeFrag,
      { defines: { 'DEFERRED': 'true' } },
    );

    const shadow = new Material( cubeVert, depthFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/cube.vert',
            '../shaders/cube.frag',
          ],
          () => {
            deferred.replaceShader( cubeVert, cubeFrag );
            shadow.replaceShader( cubeVert, depthFrag );
          },
        );
      }
    }

    return { deferred, shadow };
  }
}
