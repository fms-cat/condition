import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { IFSPiston } from './IFSPiston';
import { Material } from '../heck/Material';
import { Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { quatFromUnitVectors } from '../utils/quatFromUnitVectors';
import ifsPistonFrag from '../shaders/ifs-piston.frag';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

export class IFSPistons extends Entity {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 1.1, 10.1, 1.1 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      raymarchObjectVert,
      ifsPistonFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      raymarchObjectVert,
      ifsPistonFrag,
      {
        defines: [ 'SHADOW 1' ],
        initOptions: { geometry, target: dummyRenderTarget }
      },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/ifs-piston.frag', () => {
          deferred.replaceShader( raymarchObjectVert, ifsPistonFrag );
          depth.replaceShader( raymarchObjectVert, ifsPistonFrag );
        } );
      }
    }

    // -- children pistons -------------------------------------------------------------------------
    const up = new Vector3( [ 0, 1, 0 ] );

    ( [
      [ new Vector3( [ 1, 1, 0 ] ).normalized, 0 ],
      [ new Vector3( [ -1, -1, 0 ] ).normalized, 0 ],
      [ new Vector3( [ -1, 1, 0 ] ).normalized, 1 ],
      [ new Vector3( [ 1, -1, 0 ] ).normalized, 1 ],
    ] as [ Vector3, number ][] ).map( ( [ v, group ] ) => {
      const piston = new IFSPiston( { group, geometry, materials } );

      piston.transform.position = v.scale( 1.5 );
      piston.transform.rotation = quatFromUnitVectors( up, v );

      auto( `IFSPistons/group${ group }/pos`, ( { value } ) => {
        piston.transform.position = v.scale( value );
      } );

      this.children.push( piston );

      return piston;
    } );
  }
}
