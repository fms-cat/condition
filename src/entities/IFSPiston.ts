import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { MaterialMap } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { objectValuesMap } from '../utils/objectEntriesMap';

interface IFSPistonOptions {
  group: number;
  geometry: Geometry;
  materials: MaterialMap;
}

export class IFSPiston extends Entity {
  public constructor( { group, geometry, materials }: IFSPistonOptions ) {
    super();

    const entityCube = new Entity();
    entityCube.transform.position = new Vector3( [ 0.0, 10.0, 0.0 ] );
    this.children.push( entityCube );

    // -- animation --------------------------------------------------------------------------------
    const up = new Vector3( [ 0, 1, 0 ] );

    auto( `IFSPistons/group${ group }/rot`, ( { value } ) => {
      entityCube.transform.rotation = Quaternion.fromAxisAngle( up, 4.0 * Math.PI * value );
    } );

    // -- updater ----------------------------------------------------------------------------------
    entityCube.components.push( new Lambda( {
      onDraw: ( event ) => {
        objectValuesMap( materials, ( material ) => {
          if ( material == null ) { return; }

          material.addUniform(
            'ifsSeed',
            '1f',
            auto( `IFSPistons/group${ group }/rot` ) + 60.0 * group,
          );

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
      name: process.env.DEV && 'IFSPiston/updater',
    } ) );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'IFSPiston/mesh',
    } );
    mesh.cull = MeshCull.None;
    entityCube.components.push( mesh );
  }
}
