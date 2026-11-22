import {
  INITIAL_ZOOM_STEP,
  createSquareCrop,
  stepFor,
  zoomFor,
} from '../../src/core/image/squareCrop';

test('converte o passo do zoom e recorta o centro da foto', () => {
  expect(zoomFor(20)).toBe(1);
  expect(zoomFor(100)).toBe(3);
  expect(stepFor(zoomFor(INITIAL_ZOOM_STEP))).toBeCloseTo(INITIAL_ZOOM_STEP);

  const crop = createSquareCrop(1200, 900, 236);
  expect(crop.sourceRect({ x: 0, y: 0 }, 1)).toEqual({
    left: 150,
    top: 0,
    size: 900,
  });
  const clamped = crop.clamp({ x: 500, y: 40 }, 1);
  expect(clamped.x).toBeCloseTo(39.33);
  expect(clamped.y).toBeCloseTo(0);
});
