import { Entity } from '../heck/Entity';
import { Hooperball } from './HooperBall';
import { LightEntity } from './LightEntity';
import { PsyField } from './PsyField';
import { Racer } from './Racer';
import { Vector3 } from '@fms-cat/experimental';

interface ScenePsyOptions {
  scenes: Entity[];
}

export class ScenePsy extends Entity {
  public readonly lights: LightEntity[];

  public constructor( { scenes }: ScenePsyOptions ) {
    super();

    // -- hooperball -------------------------------------------------------------------------------
    const hooperball = new Hooperball();

    // -- field ------------------------------------------------------------------------------------
    const psyField = new PsyField();
    psyField.transform.position = new Vector3( [ 0.0, -2.0, 0.0 ] );

    const psyField2 = new PsyField();
    psyField2.transform.position = new Vector3( [ 0.0, 2.0, 0.0 ] );

    // -- racer ------------------------------------------------------------------------------------
    const racer = new Racer();

    // -- no lights --------------------------------------------------------------------------------
    this.lights = [];

    // -- scene ------------------------------------------------------------------------------------
    this.children.push(
      hooperball,
      psyField,
      psyField2,
      racer,
      ...this.lights,
    );
  }
}
