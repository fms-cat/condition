import { Vector3 } from '@fms-cat/experimental';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Entity } from '../heck/Entity';
import { createSVGTableTexture } from '../utils/createSVGTableTexture';
import { ConditionChar } from './ConditionChar';

export class Condition {
  public entity: Entity;

  public constructor() {
    this.entity = new Entity();
    this.entity.transform.scale = new Vector3( [ 0.05, 0.05, 0.05 ] );

    const pathC = createSVGTableTexture( 'M5,5l-9,0l-1,-1l0,-8l1,-1l9,0l0,2l-8,0l0,6l8,0Z' );
    const pathO = createSVGTableTexture( 'M5,4l0,-8l-1,-1l-8,0l-1,1l0,8l1,1l8,0Z' );
    const pathOi = createSVGTableTexture( 'M3,3l0,-6l-6,0l0,6Z' );
    const pathN = createSVGTableTexture( 'M5,4l0,-9l-2,0l0,8l-6,0l0,-8l-2,0l0,9l1,1l8,0Z' );
    const pathD = createSVGTableTexture( 'M5,4l0,-8l-1,-1l-9,0l0,10l9,0Z' );
    const pathI = createSVGTableTexture( 'M1,5l0,-10l-2,0l0,10Z' );
    const pathT = createSVGTableTexture( 'M5,5l0,-2l-4,0l0,-8l-2,0l0,8l-4,0l0,2Z' );

    const tableAndPos: [ GLCatTexture, number ][] = [
      [ pathC, -20 ],
      [ pathO, -14 ],
      [ pathOi, -14 ],
      [ pathN, -8 ],
      [ pathD, -2 ],
      [ pathOi, -2 ],
      [ pathI, 2 ],
      [ pathT, 6 ],
      [ pathI, 10 ],
      [ pathO, 14 ],
      [ pathOi, 14 ],
      [ pathN, 20 ],
    ];
    tableAndPos.forEach( ( [ table, pos ], i ) => {
      const svgEntity = new ConditionChar( { table, pos, i } );
      this.entity.children.push( svgEntity );
    } );
  }
}
