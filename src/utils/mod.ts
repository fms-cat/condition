export function mod( value: number, divisor: number ): number {
  return value - Math.floor( value / divisor ) * divisor;
}
