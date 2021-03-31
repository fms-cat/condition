import { ChaosTorus } from '../automaton-fxs/ChaosTorus';
import { Crystal } from './Crystal';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Quaternion, Vector3, Xorshift } from '@fms-cat/experimental';
import { Rings } from './Rings';
import { auto } from '../globals/automaton';

export class SceneCrystals extends Entity {
  public constructor() {
    super();

    // -- crystals ---------------------------------------------------------------------------------
    const crystal = new Crystal( { width: 0.4, height: 1.5, noiseOffset: 7.0 } );
    this.children.push( crystal );

    const speen = new Entity();
    this.children.push( speen );

    const up = new Vector3( [ 0.0, 1.0, 0.0 ] );
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        speen.transform.rotation = Quaternion.fromAxisAngle( up, time );
      },
    } ) );

    for ( let i = 0; i < 3; i ++ ) {
      const smolCrystal = new Crystal( { width: 0.2, height: 0.8, noiseOffset: i } );
      const t = Math.PI * i / 1.5;
      smolCrystal.transform.position = new Vector3( [ Math.cos( t ), 0.0, Math.sin( t ) ] );
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
    this.children.push( rings );

    // -- chaos torus ------------------------------------------------------------------------------
    const rng = new Xorshift( 618954 );
    const chaosToruses = [ ...Array( 6 ).keys() ].map( () => {
      const pivot = new Entity();
      pivot.transform.rotation = Quaternion.fromAxisAngle(
        new Vector3( [ 1.0, 0.0, 0.0 ] ),
        rng.gen() * 6.0,
      ).multiply( Quaternion.fromAxisAngle(
        new Vector3( [ 0.0, 1.0, 0.0 ] ),
        rng.gen() * 6.0,
      ) );
      this.children.push( pivot );

      const chaosTorus = new ChaosTorus();
      chaosTorus.transform.position = new Vector3( [ 2.5, 0.0, 0.0 ] );
      pivot.children.push( chaosTorus );

      return pivot;
    } );

    auto( 'SceneCrystals/ChaosTorus/active', ( { uninit } ) => {
      chaosToruses.map( ( entity ) => ( entity.visible = !uninit ) );
    } );
  }
}
