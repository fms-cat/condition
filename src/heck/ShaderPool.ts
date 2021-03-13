import { DISPLAY } from './DISPLAY';
import { GLCatProgram, GLCatProgramLinkOptions } from '@fms-cat/glcat-ts';
import { Material } from './Material';

export class ShaderPool<TUser> {
  private __programMap: Map<string, GLCatProgram<WebGL2RenderingContext>> = new Map();

  private __ongoingPromises: Map<string, Promise<GLCatProgram<WebGL2RenderingContext>>> = new Map();

  private __programUsersMap: Map<GLCatProgram<WebGL2RenderingContext>, Set<TUser>> = new Map();

  public getProgram(
    user: TUser,
    vert: string,
    frag: string,
    options?: GLCatProgramLinkOptions,
  ): GLCatProgram<WebGL2RenderingContext> {
    let program = this.__programMap.get( vert + frag );
    if ( !program ) {
      if ( process.env.DEV ) {
        try {
          program = DISPLAY.glCat.lazyProgram( vert, frag, options );
        } catch ( e ) {
          console.error( user );
          throw e;
        }
      } else {
        program = DISPLAY.glCat.lazyProgram( vert, frag, options );
      }

      this.__programMap.set( vert + frag, program );
    }

    this.__setUser( user, program );

    return program;
  }

  public async getProgramAsync(
    user: TUser,
    vert: string,
    frag: string,
    options?: GLCatProgramLinkOptions
  ): Promise<GLCatProgram<WebGL2RenderingContext>> {
    let program = this.__programMap.get( vert + frag );
    if ( !program ) {
      let promise = this.__ongoingPromises.get( vert + frag );
      if ( !promise ) {
        if ( process.env.DEV ) {
          promise = DISPLAY.glCat.lazyProgramAsync( vert, frag, options ).catch( ( e ) => {
            console.error( user );
            throw e;
          } );
        } else {
          promise = DISPLAY.glCat.lazyProgramAsync( vert, frag, options );
        }

        promise.then( ( program ) => {
          this.__programMap.set( vert + frag, program );
          this.__ongoingPromises.delete( vert + frag );
        } );
        this.__ongoingPromises.set( vert + frag, promise );
      }

      program = await promise;
    }

    this.__setUser( user, program );

    return program;
  }

  public discardProgram(
    user: TUser,
    vert: string,
    frag: string,
  ): void {
    const program = this.__programMap.get( vert + frag )!;

    this.__deleteUser( user, program );

    if ( this.__countUsers( program ) === 0 ) {
      program.dispose( true );
      this.__programMap.delete( vert + frag );
    }
  }

  private __setUser( user: TUser, program: GLCatProgram<WebGL2RenderingContext> ): void {
    let users = this.__programUsersMap.get( program );
    if ( !users ) {
      users = new Set();
      this.__programUsersMap.set( program, users );
    }

    if ( !users.has( user ) ) {
      users.add( user );
    }
  }

  private __deleteUser( user: TUser, program: GLCatProgram<WebGL2RenderingContext> ): void {
    const users = this.__programUsersMap.get( program )!;

    if ( !users.has( user ) ) {
      throw new Error( 'Attempt to delete an user of the program but the specified user is not an owner' );
    }
    users.delete( user );
  }

  private __countUsers( program: GLCatProgram<WebGL2RenderingContext> ): number {
    const users = this.__programUsersMap.get( program )!;
    return users.size;
  }
}

export const SHADERPOOL = new ShaderPool<Material>();
