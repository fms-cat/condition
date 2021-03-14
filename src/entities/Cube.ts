import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { Mesh } from '../heck/components/Mesh';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import cubeVert from '../shaders/cube.vert';
import cubeFrag from '../shaders/cube.frag';
import { genCube } from '../geometries/genCube';
import { Lambda } from '../heck/components/Lambda';

export class Cube {
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
    this.entity.transform.scale = this.entity.transform.scale.scale( 0.8 );

    this.geometry = this.__createGeometry();
    this.material = this.__createMaterial();

    this.mesh = new Mesh( {
      geometry: this.geometry,
      material: this.material,
      name: process.env.DEV && 'Cube/mesh',
    } );
    this.entity.components.push( this.mesh );

    this.entity.components.push( new Lambda( {
      onUpdate: ( { deltaTime } ) => {
        this.entity.transform.rotation = this.entity.transform.rotation.multiply(
          Quaternion.fromAxisAngle( new Vector3( [ 0.0, 1.0, 0.0 ] ), deltaTime )
        );
      },
      visible: false,
    } ) );
  }

  private __createGeometry(): Geometry {
    const cube = genCube();

    const geometry = new Geometry();

    geometry.addAttribute( 'position', cube.position );
    geometry.addAttribute( 'normal', cube.normal );
    geometry.setIndex( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;

    return geometry;
  }

  private __createMaterial(): Material {
    const material = new Material( cubeVert, cubeFrag );

    material.addUniform( 'inflate', '1f', 0.01 );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/cube.vert',
            '../shaders/cube.frag',
          ],
          () => {
            material.replaceShader( cubeVert, cubeFrag );
          },
        );
      }
    }

    return material;
  }
}
