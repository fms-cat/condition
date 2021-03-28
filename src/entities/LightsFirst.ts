import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { Vector3 } from '@fms-cat/experimental';

interface LightsFirstOptions {
  scenes: Entity[];
}

export class LightsFirst extends Entity {
  public readonly lights: LightEntity[];

  public constructor( { scenes }: LightsFirstOptions ) {
    super();

    const light = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightFirst',
    } );

    light.color = [ 100.0, 100.0, 100.0 ];
    light.transform.lookAt( new Vector3( [ 4.0, 4.0, 4.0 ] ) );

    this.children.push( light );

    this.lights = [ light ];
  }
}
