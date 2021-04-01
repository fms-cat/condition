import { Entity } from '../heck/Entity';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import depthFrag from '../shaders/depth.frag';
import rectTorusFrag from '../shaders/rect-torus.frag';
import rectTorusVert from '../shaders/rect-torus.vert';

export class RectTorus extends Entity {
  public mesh: Mesh;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const cube = genCube();

    const geometry = new InstancedGeometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindVertexbuffer( cube.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    const arrayInstanceId = [ ...Array( 4 ).keys() ];
    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( new Float32Array( arrayInstanceId ) );
    geometry.vao.bindVertexbuffer( bufferInstanceId, 2, 1, 1 );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;
    geometry.primcount = 4;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      rectTorusVert,
      rectTorusFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      rectTorusVert,
      depthFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/rect-torus.vert',
            '../shaders/rect-torus.frag',
          ],
          () => {
            deferred.replaceShader( rectTorusVert, rectTorusFrag );
            depth.replaceShader( rectTorusVert, depthFrag );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry: geometry,
      materials,
      name: process.env.DEV && 'Cube/mesh',
    } );
    this.components.push( this.mesh );
  }
}
