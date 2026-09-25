/** Compare flat editable form values against the last successfully loaded or saved snapshot. */
export function hasChangedFields<T extends { [K in keyof T]: string | number | boolean | null | undefined }>(
  current: T | null,
  saved: T | null,
): boolean {
  if (!current || !saved) return false;

  const keys = Object.keys(saved) as (keyof T)[];
  return keys.length !== Object.keys(current).length
    || keys.some((key) => !Object.is(current[key], saved[key]));
}
