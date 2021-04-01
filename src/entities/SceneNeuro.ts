import { BoundingBox } from './BoundingBox';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { IFSPistons } from './IFSPistons';
import { LightEntity } from './LightEntity';
import { LightShaft } from './LightShaft';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { SufferTexts } from './SufferTexts';
import { Wobbleball } from './Wobbleball';

interface SceneNeuroOptions {
  scenes: Entity[];
}

export class SceneNeuro extends Entity {
  public readonly lights: LightEntity[];
  private readonly __shafts: LightShaft[];

  public constructor( { scenes }: SceneNeuroOptions ) {
    super();

    // -- lights -----------------------------------------------------------------------------------
    type TypeScriptSucks = [ [ number, number, number ], [ number, number, number ], boolean ][];

    this.__shafts = [];

    this.lights = ( [
      [ [ 2000.0, 20.0, 100.0 ], [ 8.0, 4.0, -8.0 ], true ],
      [ [ 2000.0, 20.0, 100.0 ], [ -8.0, 4.0, -8.0 ], true ],
      [ [ 20.0, 20.0, 20.0 ], [ 0.0, -2.0, 4.0 ], false ],
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

      if ( isSpot ) {
        const shaft = new LightShaft( {
          light,
          namePrefix: process.env.DEV && `lightPink${ i }/Shaft`,
          intensity: 0.06,
        } );

        this.__shafts.push( shaft );
        light.children.push( shaft );
      }

      return light;
    } );

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.rotation = Quaternion.fromAxisAngle(
      new Vector3( [ 0.0, 0.0, 1.0 ] ),
      0.25 * Math.PI,
    );
    boundingBox.transform.scale = new Vector3( [ 1.2, 1.2, 1.2 ] );

    // -- scene ------------------------------------------------------------------------------------
    this.children.push(
      new Wobbleball(),
      new IFSPistons(),
      boundingBox,
      new SufferTexts(),
      ...this.lights,
    );
  }

  public setDefferedCameraTarget( deferredCameraTarget: BufferRenderTarget ): void {
    this.__shafts.map( ( shaft ) => {
      shaft.setDefferedCameraTarget( deferredCameraTarget );
    } );
  }
}
