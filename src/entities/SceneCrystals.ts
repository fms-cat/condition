import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { ChaosTorus } from '../automaton-fxs/ChaosTorus';
import { Crystal } from './Crystal';
import { Entity } from '../heck/Entity';
import { Greetings } from './Greetings';
import { Lambda } from '../heck/components/Lambda';
import { LightEntity } from './LightEntity';
import { Phantom } from './Phantom';
import { Quaternion, Vector3, Xorshift } from '@fms-cat/experimental';
import { Rings } from './Rings';
import { auto } from '../globals/automaton';

interface SceneCrystalsOptions {
  scenes: Entity[];
}

export class SceneCrystals extends Entity {
  public readonly lights: LightEntity[];
  private __phantom: Phantom;

  public constructor( { scenes }: SceneCrystalsOptions ) {
    super();

    // -- crystals ---------------------------------------------------------------------------------
    const crystal = new Crystal( { width: 0.3, height: 1.5, noiseOffset: 7.0 } );

    const speen = new Entity();

    const up = new Vector3( [ 0.0, 1.0, 0.0 ] );
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        speen.transform.rotation = Quaternion.fromAxisAngle( up, time );
      },
    } ) );

    for ( let i = 0; i < 3; i ++ ) {
      const smolCrystal = new Crystal( { width: 0.3, height: 1.5, noiseOffset: i } );
      const t = Math.PI * i / 1.5;
      smolCrystal.transform.position = new Vector3( [ Math.cos( t ), 0.0, Math.sin( t ) ] );
      smolCrystal.transform.scale = new Vector3( [ 0.5, 0.5, 0.5 ] );
      speen.children.push( smolCrystal );
    }

    // -- rings ------------------------------------------------------------------------------------
    const rings = new Rings();
    rings.transform.rotation = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      0.1,
    ).multiply( Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.1,
    ) );

    // -- chaos torus ------------------------------------------------------------------------------
    const rng = new Xorshift( 618954 );
    const chaosToruses = [ ...Array( 6 ).keys() ].map( () => {
      const pivot = new Entity();
      pivot.visible = false;
      pivot.transform.rotation = Quaternion.fromAxisAngle(
        new Vector3( [ 1.0, 0.0, 0.0 ] ),
        rng.gen() * 6.0,
      ).multiply( Quaternion.fromAxisAngle(
        new Vector3( [ 0.0, 1.0, 0.0 ] ),
        rng.gen() * 6.0,
      ) );

      const chaosTorus = new ChaosTorus();
      chaosTorus.transform.position = new Vector3( [ 2.5, 0.0, 0.0 ] );
      pivot.children.push( chaosTorus );

      return pivot;
    } );

    auto( 'SceneCrystals/ChaosTorus/active', ( { uninit } ) => {
      chaosToruses.map( ( entity ) => ( entity.visible = !uninit ) );
    } );

    // -- phantom ----------------------------------------------------------------------------------
    const phantom = this.__phantom = new Phantom();

    // -- greetings --------------------------------------------------------------------------------
    const greetings = new Greetings();

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new LightEntity( {
      scenes,
      shadowMapFov: 30.0,
      shadowMapNear: 1.0,
      shadowMapFar: 20.0,
      namePrefix: process.env.DEV && 'lightCrystals1',
    } );
    light1.color = [ 100.0, 100.0, 100.0 ];
    light1.transform.lookAt( new Vector3( [ 0.0, 4.0, 1.0 ] ) );

    auto( 'SceneCrystals/light/amp', ( { value } ) => {
      light1.active = value > 0.0;
      light1.color = [ 100.0 * value, 100.0 * value, 100.0 * value ];
    } );

    this.lights = [ light1 ];

    // -- children ---------------------------------------------------------------------------------
    this.children.push(
      crystal,
      speen,
      rings,
      ...chaosToruses,
      phantom,
      greetings,
      ...this.lights,
    );
  }

  public setDefferedCameraTarget( deferredCameraTarget: BufferRenderTarget ): void {
    this.__phantom.setDefferedCameraTarget( deferredCameraTarget );
  }
}
