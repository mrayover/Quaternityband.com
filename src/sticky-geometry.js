// Reveal each retained band over one frame thickness, not in a single jump.
// Section positions and the crown edge are both viewport coordinates.
export function stickyClosureDepth(sectionTops, crownBottom, frameStep) {
  return sectionTops.reduce((depth, top, index) => depth + Math.max(
    0,
    Math.min(frameStep, crownBottom + (index + 1) * frameStep - top),
  ), 0)
}

export function stickyCornerProgress(depth, bandBottom, frameStep) {
  return Math.max(0, Math.min(1, (depth - bandBottom) / frameStep))
}
