export type Slot = { x: number; y: number; side: 'left' | 'right' }

export function visualSlots(count: number, split: boolean): Slot[] {
  const columns = split ? 2 : 5
  const rows = Math.max(5, Math.ceil((count + (split ? 0 : 5)) / columns))
  return Array.from({ length: split ? 2 : 1 }, (_, side) =>
    Array.from({ length: rows * columns }, (_, i) => ({
      x: split
        ? (side ? 68 : 12) + (i % columns) * 20
        : 10 + (i % columns) * 20,
      y: 24 + (Math.floor(i / columns) * 64) / (rows - 1),
      side: side ? ('right' as const) : ('left' as const),
    })),
  ).flat()
}

export function nearestEmptySlot(
  slots: Slot[],
  occupied: { x: number; y: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return slots
    .filter(
      (slot) =>
        !occupied.some((item) => item.x === slot.x && item.y === slot.y),
    )
    .reduce<Slot | undefined>((best, slot) => {
      const distance = (point: Slot) =>
        ((point.x - x) * width) ** 2 + ((point.y - y) * height) ** 2
      return !best || distance(slot) < distance(best) ? slot : best
    }, undefined)
}
