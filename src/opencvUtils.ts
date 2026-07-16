export function getCv() {
  if (typeof (window as any).cv !== 'undefined') {
    return (window as any).cv;
  }
  throw new Error("OpenCV is not loaded yet.");
}

export function isCvLoaded() {
  return typeof (window as any).cv !== 'undefined' && (window as any).cv.Mat !== undefined;
}
