import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { TRIANGLE_STRIP_QUAD, Vector3 } from '@fms-cat/experimental';
import { gl, glCat } from '../heck/canvas';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import raymarcherFrag from '../shaders/raymarcher.frag';
import { Lambda } from '../heck/components/Lambda';

export class Raymarcher {
  private __mesh: Mesh;
  private __geometry: Geometry;

  private __material: Material;

  public get material(): Material {
    return this.__material;
  }

  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: {
    textureRandom: GLCatTexture<WebGL2RenderingContext>;
    textureRandomStatic: GLCatTexture<WebGL2RenderingContext>;
  } ) {
    this.__entity = new Entity();
    this.__entity.transform.position = new Vector3( [ 0.0, 0.0, 0.3 ] );
    this.__entity.transform.scale = new Vector3( [ 16.0, 9.0, 1.0 ] ).scale( 0.15 );

    this.__geometry = this.__createGeoemtry();
    this.__material = this.__createMaterial();

    this.__material.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );

    this.__material.addUniformTexture( 'samplerRandom', options.textureRandom );
    this.__material.addUniformTexture( 'samplerRandomStatic', options.textureRandomStatic );

    this.__entity.components.push( new Lambda( {
      onDraw: ( event ) => {
        this.__material.addUniform(
          'cameraNearFar',
          '2f',
          event.camera.near,
          event.camera.far
        );

        this.__material.addUniformVector(
          'inversePV',
          'Matrix4fv',
          event.projectionMatrix.multiply( event.viewMatrix ).inverse!.elements
        );
      },
      active: false,
      name: process.env.DEV && 'Raymarcher/setCameraUniforms',
    } ) );

    this.__mesh = new Mesh( {
      geometry: this.__geometry,
      material: this.__material,
      name: process.env.DEV && 'Raymarcher/mesh',
    } );
    this.__mesh.cull = MeshCull.None;
    this.__entity.components.push( this.__mesh );
  }

  protected __createGeoemtry(): Geometry {
    const geometry = new Geometry();

    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );
    geometry.addAttribute( 'p', {
      buffer: bufferPos,
      size: 2,
      type: gl.FLOAT
    } );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;

    return geometry;
  }

  protected __createMaterial(): Material {
    const material = new Material( quadVert, raymarcherFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/raymarcher.frag', () => {
          material.replaceShader( quadVert, raymarcherFrag );
        } );
      }
    }

    return material;
  }
}
