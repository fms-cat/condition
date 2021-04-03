import { Condition } from './Condition';
import { Cube } from './Cube';
import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { Vector3 } from '@fms-cat/experimental';


interface SceneBeginOptions {
  scenes: Entity[];
}

export class SceneBegin extends Entity {
  public readonly lights: LightEntity[];

  public constructor( { scenes }: SceneBeginOptions ) {
    super();

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      name: process.env.DEV && 'light1',
      brtNamePrefix: process.env.DEV && 'SceneBegin/light1',
    } );
    light1.color = [ 200.0, 200.0, 200.0 ];
    light1.transform.lookAt( new Vector3( [ 4.0, 4.0, 4.0 ] ) );

    const light2 = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      name: process.env.DEV && 'light2',
      brtNamePrefix: process.env.DEV && 'SceneBegin/light2',
    } );
    light2.color = [ 80.0, 90.0, 100.0 ];
    light2.transform.lookAt( new Vector3( [ -4.0, 0.0, -4.0 ] ) );

    this.lights = [ light1, light2 ];

    // -- scene ------------------------------------------------------------------------------------
    this.children.push(
      new Cube(),
      new Condition(),
      ...this.lights,
    );
  }
}
