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

    // -- 1 ----------------------------------------------------------------------------------------
    const light1 = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightFirst',
    } );

    light1.color = [ 400.0, 400.0, 400.0 ];
    light1.transform.lookAt( new Vector3( [ 4.0, 4.0, 4.0 ] ) );

    this.children.push( light1 );

    // -- 2 ----------------------------------------------------------------------------------------
    const light2 = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightFirst',
    } );

    light2.color = [ 100.0, 140.0, 200.0 ];
    light2.transform.lookAt( new Vector3( [ -4.0, 0.0, -4.0 ] ) );

    this.children.push( light2 );

    // -- haha -------------------------------------------------------------------------------------
    this.lights = [ light1, light2 ];
  }
}
