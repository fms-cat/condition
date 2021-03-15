export function arraySetDelete<T>( array: Array<T>, element: T ): boolean {
  const index = array.indexOf( element );
  if ( index !== -1 ) {
    array.splice( index, 1 );
    return true;
  }
  return false;
}
