export function createDefineString( defines: { [ identifier: string ]: string | undefined } ): string {
  return Object.entries( defines ).map( ( [ identifier, value ] ) => (
    value ? `#define ${identifier} ${value}\n` : ''
  ) ).join( '' );
}
