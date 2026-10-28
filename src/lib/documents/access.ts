export type DocumentAccessData = {
  owner?: unknown;
  share?: unknown;
  content?: unknown;
};

export function canReadDocument(
  data: DocumentAccessData | undefined,
  uid: string
): boolean {
  if (!data || !uid) return false;
  if (data.owner === uid) return true;
  return Array.isArray(data.share) && data.share.includes(uid);
}

export function contentReferencesImage(
  content: unknown,
  imageKey: string
): boolean {
  if (!imageKey) return false;
  let blob = "";
  try {
    blob = typeof content === "string" ? content : JSON.stringify(content ?? "");
  } catch {
    return false;
  }
  return blob.includes(imageKey) || blob.includes(encodeURIComponent(imageKey));
}
