import { Crystal } from './Crystal';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { Rings } from './Rings';

export class SceneCrystals extends Entity {
  public constructor() {
    super();

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

    const rings = new Rings();
    rings.transform.rotation = Quaternion.fromAxisAngle(
      new Vector3( [ 1.0, 0.0, 0.0 ] ),
      0.1,
    ).multiply( Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.1,
    ) );
    this.children.push( rings );
  }
}
