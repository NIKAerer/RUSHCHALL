/** Index de la plus petite (ou plus grande) valeur, null en cas d'égalité ou de valeur manquante. */
export function aheadOf(values: (number | null)[], lowerIsBetter: boolean): number | null {
  if (values.some((v) => v === null) || new Set(values).size < 2) return null
  const best = (lowerIsBetter ? Math.min : Math.max)(...(values as number[]))
  return values.indexOf(best)
}
