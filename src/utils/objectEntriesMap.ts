export function objectEntriesMap<TValue, TReturn>(
  object: { [ key: string ]: TValue },
  func: ( entry: [ string, TValue ] ) => TReturn,
): TReturn[] {
  return Object.entries( object ).map( func );
}

export function objectValuesMap<TValue, TReturn>(
  object: { [ key: string ]: TValue },
  func: ( entry: TValue ) => TReturn,
): TReturn[] {
  return Object.values( object ).map( func );
}
