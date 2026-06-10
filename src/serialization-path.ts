export function withPath(path: string, segment: string) {
  return path ? `${path}.${segment}` : segment;
}
