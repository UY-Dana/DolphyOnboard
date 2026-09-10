import { NextResponse } from "next/server";
import { submissionSchema } from "@/lib/schema";
import { saveSubmission } from "@/lib/storage";
export const runtime = "nodejs";
const buckets = new Map<string, { count: number; expires: number }>();
function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || "http://localhost:3000";
  if (origin !== expected)
    return response(
      { error: "This request could not be verified. Please reload the page." },
      403,
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return response({ error: "Expected a JSON request." }, 415);
  if (Number(request.headers.get("content-length")) > 24000)
    return response({ error: "The brief is too long." }, 413);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  for (const [key, b] of buckets) if (b.expires < now) buckets.delete(key);
  const bucket = buckets.get(ip) || { count: 0, expires: now + 600000 };
  bucket.count++;
  buckets.set(ip, bucket);
  if (bucket.count > 10)
    return response(
      {
        error: "A few too many attempts. Please wait 10 minutes and try again.",
      },
      429,
    );
  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({ error: "The brief is empty." }, 400);
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 24000) {
        await reader.cancel();
        return response({ error: "The brief is too long." }, 413);
      }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return response({ error: "The brief could not be read." }, 400);
  }
  const parsed = submissionSchema.safeParse(payload);
  if (!parsed.success)
    return response(
      {
        error: "Please check your answers before sending.",
        fields: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  if (!process.env.DATABASE_URL)
    return response(
      {
        error:
          "Project submissions aren’t open yet. Your answers are saved — please contact DOLPHY or try again later.",
      },
      503,
    );
  try {
    await saveSubmission(parsed.data, parsed.data.submissionId);
    return response({ success: true });
  } catch {
    return response(
      {
        error:
          "We couldn’t confirm delivery of your brief. Your answers are saved. Please try again in a moment.",
      },
      502,
    );
  }
}
