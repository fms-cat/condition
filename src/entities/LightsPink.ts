import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { LightEntity } from './LightEntity';
import { LightShaft } from './LightShaft';
import { Vector3 } from '@fms-cat/experimental';

interface LightsPinkOptions {
  scenes: Entity[];
}

export class LightsPink extends Entity {
  public readonly lights: LightEntity[];
  private readonly __shafts: LightShaft[];

  public constructor( { scenes }: LightsPinkOptions ) {
    super();

    type TypeScriptSucks = [ [ number, number, number ], [ number, number, number ], boolean ][];

    this.__shafts = [];

    this.lights = ( [
      [ [ 6000.0, 10.0, 200.0 ], [ 8.0, 4.0, -8.0 ], true ],
      [ [ 6000.0, 10.0, 200.0 ], [ -8.0, 4.0, -8.0 ], true ],
      [ [ 10.0, 14.0, 20.0 ], [ 0.0, -4.0, 4.0 ], false ],
    ] as TypeScriptSucks ).map( ( [ color, pos, isSpot ], i ) => {
      const light = new LightEntity( {
        scenes,
        shadowMapFov: isSpot ? 15.0 : 50.0,
        shadowMapNear: 0.5,
        shadowMapFar: 20.0,
        shadowMapSize: isSpot ? 64 : 256,
        namePrefix: process.env.DEV && `lightPink${ i }/light`,
      } );

      light.color = color;
      light.spotness = isSpot ? 0.9 : 0.0;
      light.transform.lookAt( new Vector3( pos ) );

      this.children.push( light );

      if ( isSpot ) {
        const shaft = new LightShaft( {
          light,
          namePrefix: process.env.DEV && `lightPink${ i }/Shaft`,
        } );

        this.__shafts.push( shaft );
        light.children.push( shaft );
      }

      return light;
    } );
  }

  public setDefferedCameraTarget( deferredCameraTarget: BufferRenderTarget ): void {
    this.__shafts.map( ( shaft ) => {
      shaft.setDefferedCameraTarget( deferredCameraTarget );
    } );
  }
}
