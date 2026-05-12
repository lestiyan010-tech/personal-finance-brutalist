import { auth } from "@/auth";

const DEFAULT_BASE = "https://openrouter.ai/api/v1";

type Body = { imageUrl: string; prompt?: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, prompt = "Extract finance transaction info from this image" } = (await req.json()) as Body;
  if (!imageUrl) return Response.json({ error: "imageUrl is required" }, { status: 400 });

  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  const baseUrl = process.env.AI_BASE_URL || DEFAULT_BASE;
  const model = process.env.AI_MODEL || "openai/gpt-4o-mini";
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) return Response.json({ error: "AI_API_KEY belum diset" }, { status: 500 });

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(provider === "openrouter" ? { "HTTP-Referer": "https://localhost", "X-Title": "BrutalBudget" } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) return Response.json({ error: "AI request failed", data }, { status: res.status });

  return Response.json({
    provider,
    model,
    text: data?.choices?.[0]?.message?.content || "",
    raw: data,
  });
}
