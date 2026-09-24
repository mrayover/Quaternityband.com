import assert from 'node:assert/strict'
import test from 'node:test'
import { stickyClosureDepth, stickyCornerProgress } from '../src/sticky-geometry.js'

for (const gap of [6, 12]) {
  const crown = 241.375
  const topsAt = (index, top) => Array.from({ length: 4 }, (_, i) =>
    i < index ? -1000 : i === index ? top : 10000
  )

  test(`${gap}px frames: each closure is continuous, reversible and bounded`, () => {
    for (let index = 0; index < 4; index++) {
      const catchLine = crown + index * gap
      const samples = []
      for (let distance = gap + 1; distance >= -1; distance -= 0.125) {
        const top = catchLine + distance
        const depth = stickyClosureDepth(topsAt(index, top), crown, gap)
        const expected = index * gap + Math.max(0, Math.min(gap, gap - distance))
        assert.equal(depth, expected)
        const previous = samples.at(-1)
        if (previous) assert.ok(Math.abs(depth - previous.depth) <= 0.125)
        samples.push({ top, depth })
        for (let band = 1; band <= 4; band++) {
          const retained = Math.min(depth, band * gap)
          const progress = stickyCornerProgress(depth, retained, gap)
          assert.ok(progress >= 0 && progress <= 1)
          if (retained === depth) assert.equal(progress, 0)
        }
      }
      for (const { top, depth } of samples.reverse()) {
        assert.equal(stickyClosureDepth(topsAt(index, top), crown, gap), depth)
      }
    }
  })

  test(`${gap}px frames: settled section stops retain original band heights`, () => {
    for (let index = 0; index < 4; index++) {
      const depth = stickyClosureDepth(topsAt(index, crown + index * gap - 1), crown, gap)
      assert.equal(depth, (index + 1) * gap)
      assert.equal(stickyCornerProgress(depth, 0, gap), 1)
      for (let band = 1; band <= 4; band++) {
        assert.equal(Math.min(depth, band * gap), Math.min(index + 1, band) * gap)
      }
    }
  })
}

test('absent sections do not introduce a closure or NaN', () => {
  assert.equal(stickyClosureDepth([Infinity, Infinity, Infinity, Infinity], 240, 12), 0)
})

test('corner reveal is continuous across both ends of a band', () => {
  assert.equal(stickyCornerProgress(12, 12, 12), 0)
  assert.equal(stickyCornerProgress(18, 12, 12), 0.5)
  assert.equal(stickyCornerProgress(24, 12, 12), 1)
  assert.equal(stickyCornerProgress(48, 12, 12), 1)
})
