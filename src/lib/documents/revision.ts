export class DocumentRevisionConflict extends Error {
  constructor() {
    super("conflict");
    this.name = "DocumentRevisionConflict";
  }
}

/** Next revision when `baseRevision` still matches the server, otherwise null. */
export function nextRevision(
  serverRevision: unknown,
  baseRevision: number
): number | null {
  const server =
    typeof serverRevision === "number" && Number.isInteger(serverRevision)
      ? serverRevision
      : 0;
  if (!Number.isInteger(baseRevision) || server !== baseRevision) return null;
  return server + 1;
}

export function readRevision(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}
