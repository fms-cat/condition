export function iterateOverMap<TKey, TValue, TReturn>(
  map: Map<TKey, TValue>,
  func: ( value: TValue, key: TKey ) => TReturn,
): TReturn[] {
  return Array.from( map.entries() ).map( ( [ key, value ] ) => func( value, key ) );
}
