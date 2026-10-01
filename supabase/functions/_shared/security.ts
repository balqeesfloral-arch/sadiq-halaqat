import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readBody(req: Request, maxBytes = 16384) {
  if (Number(req.headers.get("content-length") || 0) > maxBytes) {
    throw new RequestError("الطلب أكبر من الحد المسموح.", 413);
  }
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError("الطلب غير صالح.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError("الطلب أكبر من الحد المسموح.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("الطلب غير صالح.");
  } finally { reader.releaseLock(); }
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function studentAccessCode(studentId: number, version: string, secret: string) {
  const digest = await hmac(`student-card:v1:${studentId}:${version}`, secret);
  let value = 0n;
  for (const byte of digest.slice(0, 8)) value = (value << 8n) | BigInt(byte);
  return (value % 100000000n).toString().padStart(8, "0");
}

export function normalizeCode(value: unknown) {
  return String(value ?? "").replace(/[٠-٩۰-۹]/g, char =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(char) >= 0 ? "٠١٢٣٤٥٦٧٨٩".indexOf(char) : "۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
    .replace(/[\s-]/g, "");
}

export function codesEqual(expected: string, actual: string) {
  if (!/^\d{8}$/.test(actual)) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) result |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return result === 0;
}

export async function quota(admin: SupabaseClient, secret: string, scope: string,
  subject: string, limit: number, seconds: number) {
  const digest = await hmac(`quota:v1:${scope}:${subject}`, secret);
  const key = `${scope}:${Array.from(digest, b => b.toString(16).padStart(2, "0")).join("")}`;
  const { data, error } = await admin.rpc("take_security_quota", {
    p_key: key, p_limit: limit, p_window_seconds: seconds,
  });
  if (error) throw new RequestError("الخدمة غير متاحة مؤقتًا. حاول بعد قليل.", 503);
  if (data !== true) throw new RequestError("محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.", 429);
}

export function clientAddress(req: Request) {
  // Hosted Supabase is behind Cloudflare, which supplies the visitor address.
  const cloudflare = req.headers.get("cf-connecting-ip")?.trim() || "";
  if (/^[0-9a-f:.]{3,64}$/i.test(cloudflare)) return cloudflare;
  // Fallback to the gateway-appended address, never the first caller XFF entry.
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "";
  return /^[0-9a-f:.]{3,64}$/i.test(forwarded) ? forwarded : "unknown";
}

export function validPushEndpoint(endpoint: string) {
  if (endpoint.length < 30 || endpoint.length > 2048 || /[\s#]/.test(endpoint)) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.username && !url.password &&
      (!url.port || url.port === "443") &&
      /^(fcm\.googleapis\.com|([a-z0-9-]+\.)?push\.services\.mozilla\.com|([a-z0-9-]+\.)?push\.apple\.com|([a-z0-9-]+\.)?notify\.windows\.com)$/.test(url.hostname);
  } catch { return false; }
}

export function safeAppPath(value: unknown, fallback = "/") {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") &&
    !Array.from(path).some(char => char.charCodeAt(0) <= 32) ? path : fallback;
}
