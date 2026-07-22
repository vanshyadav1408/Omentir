import "server-only";

export class RequestBodyTooLargeError extends Error {}

export async function readTextBody(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RequestBodyTooLargeError("Request body is too large.");
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return body + decoder.decode();
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError("Request body is too large.");
    }
    body += decoder.decode(value, { stream: true });
  }
}

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T | null> {
  const text = await readTextBody(request, maxBytes);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
