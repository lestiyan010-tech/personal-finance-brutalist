import { currentUserId } from "@/lib/current-user";
import { transformNotionPage, type NotionPage } from "@/lib/notion";
import { prisma } from "@/lib/prisma";

type NotionQueryResponse = {
  results?: NotionPage[];
  has_more?: boolean;
  next_cursor?: string | null;
};

async function queryNotion(startCursor?: string | null): Promise<NotionQueryResponse> {
  const apiKey = process.env.NOTION_API_KEY;
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

  if (!apiKey) throw new Error("NOTION_API_KEY kosong");
  if (!dataSourceId) throw new Error("NOTION_DATA_SOURCE_ID kosong");

  const res = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": process.env.NOTION_VERSION || "2025-09-03",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 100,
      sorts: [{ property: "Tanggal", direction: "descending" }],
      ...(startCursor ? { start_cursor: startCursor } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion sync failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function POST() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let cursor: string | null | undefined;
  let hasMore = true;
  let upserted = 0;

  try {
    while (hasMore) {
      const data = await queryNotion(cursor);
      const rows = (data.results || [])
        .map((page) => transformNotionPage(page, userId))
        .filter((row) => row !== null);

      for (const row of rows) {
        await prisma.transaction.upsert({
          where: { notionPageId: row.notionPageId },
          create: row,
          update: {
            userId: row.userId,
            title: row.title,
            happenedAt: row.happenedAt,
            type: row.type,
            category: row.category,
            account: row.account,
            amount: row.amount,
            notes: row.notes,
            rawJson: row.rawJson,
            syncedAt: row.syncedAt,
          },
        });
      }

      upserted += rows.length;
      hasMore = Boolean(data.has_more);
      cursor = data.next_cursor;
    }

    return Response.json({ ok: true, upserted, time: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown sync error" },
      { status: 500 }
    );
  }
}
