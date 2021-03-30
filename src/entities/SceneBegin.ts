import { Condition } from './Condition';
import { Cube } from './Cube';
import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { Vector3 } from '@fms-cat/experimental';

export class SceneBegin extends Entity {
  public readonly lights: LightEntity[];

  public constructor() {
    super();

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new LightEntity( {
      scenes: [ this ],
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightBegin1',
    } );
    light1.color = [ 200.0, 200.0, 200.0 ];
    light1.transform.lookAt( new Vector3( [ 4.0, 4.0, 4.0 ] ) );

    const light2 = new LightEntity( {
      scenes: [ this ],
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightBegin2',
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
