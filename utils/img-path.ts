export function devImgPath(src: string) {
  // If is dev environment, replace .test with .com
  if (import.meta.env.MODE === 'development') {
    const modifiedPath = src.replace('.test', '.com');
    return modifiedPath;
  }
  return src;
}
