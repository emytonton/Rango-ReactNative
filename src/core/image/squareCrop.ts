export const CROP_OUTPUT_SIZE = 512;
export const MIN_ZOOM_STEP = 20;
export const MAX_ZOOM_STEP = 100;
export const INITIAL_ZOOM_STEP = 45;

export type Point = { x: number; y: number };

export type CropRect = { left: number; top: number; size: number };

export function zoomFor(step: number): number {
  return 1 + ((step - MIN_ZOOM_STEP) / (MAX_ZOOM_STEP - MIN_ZOOM_STEP)) * 2;
}

export function stepFor(zoom: number): number {
  return MIN_ZOOM_STEP + ((zoom - 1) / 2) * (MAX_ZOOM_STEP - MIN_ZOOM_STEP);
}

export function createSquareCrop(
  imageWidth: number,
  imageHeight: number,
  viewport: number,
) {
  const scale = (zoom: number) =>
    (viewport / Math.min(imageWidth, imageHeight)) * zoom;

  const clamp = (offset: Point, zoom: number): Point => {
    const current = scale(zoom);
    const maxX = (imageWidth * current - viewport) / 2;
    const maxY = (imageHeight * current - viewport) / 2;
    return {
      x: Math.min(Math.max(offset.x, -maxX), maxX),
      y: Math.min(Math.max(offset.y, -maxY), maxY),
    };
  };

  const sourceRect = (offset: Point, zoom: number): CropRect => {
    const current = scale(zoom);
    const clamped = clamp(offset, zoom);
    const size = Math.min(
      viewport / current,
      Math.min(imageWidth, imageHeight),
    );
    const left = imageWidth / 2 - clamped.x / current - size / 2;
    const top = imageHeight / 2 - clamped.y / current - size / 2;
    return {
      left: Math.round(Math.min(Math.max(left, 0), imageWidth - size)),
      top: Math.round(Math.min(Math.max(top, 0), imageHeight - size)),
      size: Math.floor(size),
    };
  };

  return { scale, clamp, sourceRect };
}
