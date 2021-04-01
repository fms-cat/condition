import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { CyclicBoard } from './CyclicBoard';
import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { LightShaft } from './LightShaft';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { RectTorus } from './RectTorus';

interface SceneDynamicOptions {
  scenes: Entity[];
}

export class SceneDynamic extends Entity {
  public readonly lights: LightEntity[];
  private readonly __shafts: LightShaft[];

  public constructor( { scenes }: SceneDynamicOptions ) {
    super();

    // -- rectTorus --------------------------------------------------------------------------------
    const rectToruses = [ ...new Array( 4 ).keys() ].map( ( i ) => {
      const rectTorus = new RectTorus();

      rectTorus.transform.position = new Vector3( [ 0.0, 0.0, -0.5 - 0.5 * i ] );
      rectTorus.transform.rotation = Quaternion.fromAxisAngle(
        new Vector3( [ 1.0, 0.0, 0.0 ] ).normalized,
        1.57
      ).multiply( Quaternion.fromAxisAngle(
        new Vector3( [ 0.0, 1.0, 0.0 ] ).normalized,
        i
      ).multiply( Quaternion.fromAxisAngle(
        new Vector3( [ 1.0, 0.0, 1.0 ] ).normalized,
        0.1
      ) ) );

      return rectTorus;
    } );

    // -- cyclic board -----------------------------------------------------------------------------
    const cyclicBoard = new CyclicBoard();
    cyclicBoard.transform.position = new Vector3( [ 0.0, -2.0, 0.0 ] );

    // -- lights -----------------------------------------------------------------------------------
    this.__shafts = [];

    const light1 = new LightEntity( {
      scenes,
      shadowMapFov: 70.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightDynamic1',
    } );
    light1.color = [ 50.0, 50.0, 50.0 ];
    light1.transform.lookAt( new Vector3( [ 5.0, 5.0, 5.0 ] ) );

    const light2 = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightDynamic2',
    } );
    light2.spotness = 0.9;
    light2.color = [ 300.0, 360.0, 400.0 ];
    light2.transform.lookAt( new Vector3( [ 0.0, 6.0, 1.0 ] ) );

    const shaft = new LightShaft( {
      light: light2,
      namePrefix: process.env.DEV && 'sceneDynamic/light2/Shaft',
      intensity: 0.06,
    } );
    light2.children.push( shaft );
    this.__shafts.push( shaft );

    this.lights = [ light1, light2 ];
    cyclicBoard.lights.push( ...this.lights );

    // -- scene ------------------------------------------------------------------------------------
    this.children.push(
      ...rectToruses,
      cyclicBoard,
      ...this.lights,
    );
  }

  public setDefferedCameraTarget( deferredCameraTarget: BufferRenderTarget ): void {
    this.__shafts.map( ( shaft ) => {
      shaft.setDefferedCameraTarget( deferredCameraTarget );
    } );
  }
}
