import { Matrix4, Quaternion, Vector3 } from '@fms-cat/experimental';

export class Transform {
  protected __position: Vector3 = Vector3.zero;

  public get position(): Vector3 {
    return this.__position;
  }

  public set position( vector: Vector3 ) {
    this.__position = vector;

    this.__matrix = Matrix4.compose( this.__position, this.__rotation, this.__scale );
  }

  protected __rotation: Quaternion = Quaternion.identity;

  public get rotation(): Quaternion {
    return this.__rotation;
  }

  public set rotation( quaternion: Quaternion ) {
    this.__rotation = quaternion;

    this.__matrix = Matrix4.compose( this.__position, this.__rotation, this.__scale );
  }

  protected __scale: Vector3 = Vector3.one;

  public get scale(): Vector3 {
    return this.__scale;
  }

  public set scale( vector: Vector3 ) {
    this.__scale = vector;

    this.__matrix = Matrix4.compose( this.__position, this.__rotation, this.__scale );
  }

  protected __matrix: Matrix4 = Matrix4.identity;

  public get matrix(): Matrix4 {
    return this.__matrix;
  }

  public set matrix( matrix: Matrix4 ) {
    this.__matrix = matrix;

    const decomposed = this.__matrix.decompose();
    this.__position = decomposed.position;
    this.__rotation = decomposed.rotation;
    this.__scale = decomposed.scale;
  }

  public lookAt( position: Vector3, target?: Vector3, up?: Vector3, roll?: number ): void {
    this.matrix = Matrix4.lookAt( position, target, up, roll );
  }

  public multiply( transform: Transform ): Transform {
    const result = new Transform();
    result.matrix = this.matrix.multiply( transform.matrix );
    return result;
  }
}
