export function hasField<K extends string>(
  obj: unknown,
  key: K
): obj is { [k in K]: unknown } {
  return obj instanceof Object && key in obj;
}
