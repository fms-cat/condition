import { Pool } from '../utils/Pool';
import { gl, glCat } from './canvas';

export class GPUTimer {
  public queries: Pool<WebGLQuery>;
  public stack: Promise<number>[];
  public ext: any;

  public constructor() {
    const queries = new Array( 1024 ).fill( 1 ).map( () => gl.createQuery()! );
    this.queries = new Pool( queries );

    this.stack = [];

    this.ext = glCat.getExtension( 'EXT_disjoint_timer_query_webgl2' );
  }

  public async measure( func: () => void ): Promise<number> {
    if ( this.stack.length !== 0 ) {
      gl.endQuery( this.ext.TIME_ELAPSED_EXT );
      const promiseFinishingPrev = this.check( this.queries.current );

      this.stack = this.stack.map( async ( promiseAccum ) => {
        return ( await promiseAccum ) + ( await promiseFinishingPrev );
      } );
    }

    this.stack.push( Promise.resolve( 0.0 ) );

    gl.beginQuery( this.ext.TIME_ELAPSED_EXT, this.queries.next() );

    func();

    gl.endQuery( this.ext.TIME_ELAPSED_EXT );

    const promiseAccum = this.stack.pop()!;
    const promiseThis = this.check( this.queries.current );

    if ( this.stack.length !== 0 ) {
      this.stack = this.stack.map( async ( promiseAccum ) => {
        return ( await promiseAccum ) + ( await promiseThis );
      } );

      gl.beginQuery( this.ext.TIME_ELAPSED_EXT, this.queries.next() );
    }

    return ( await promiseAccum ) + ( await promiseThis );
  }

  public check( query: WebGLQuery ): Promise<number> {
    return new Promise( ( resolve ) => {
      const loop = () => {
        const isAvailable = gl.getQueryParameter( query, gl.QUERY_RESULT_AVAILABLE );

        if ( isAvailable ) {
          resolve( gl.getQueryParameter( query, gl.QUERY_RESULT ) * 0.001 * 0.001 );
        } else {
          setTimeout( loop, 1 );
        }
      }

      loop();
    } );
  }
}
