import { normalizeCategory, isMicroTransaction, mapNotionType } from "@/lib/finance";

type NotionProperty = {
  title?: Array<{ plain_text?: string }>;
  rich_text?: Array<{ plain_text?: string }>;
  date?: { start?: string | null } | null;
  select?: { name?: string | null } | null;
  number?: number | null;
};

export type NotionPage = {
  id?: string;
  created_time?: string;
  properties?: Record<string, NotionProperty>;
};

export function extractTitle(prop?: NotionProperty) {
  return (prop?.title || []).map((item) => item.plain_text || "").join("").trim();
}

export function extractRichText(prop?: NotionProperty) {
  return (prop?.rich_text || []).map((item) => item.plain_text || "").join("").trim();
}

export function transformNotionPage(page: NotionPage, userId: string) {
  const props = page.properties || {};
  const title = extractTitle(props.Transaksi);
  const happenedAt = props.Tanggal?.date?.start;
  const notionType = props.Tipe?.select?.name;
  const categoryRaw = props.Kategori?.select?.name;
  const account = props.Akun?.select?.name;
  const amount = props.Nominal?.number;
  const notes = extractRichText(props.Catatan);

  if (!page.id || isMicroTransaction(amount)) return null;

  return {
    userId,
    notionPageId: page.id,
    title,
    happenedAt: new Date(happenedAt || page.created_time || Date.now()),
    type: mapNotionType(notionType),
    category: normalizeCategory(title, categoryRaw),
    account,
    amount: amount || 0,
    notes,
    rawJson: page,
    syncedAt: new Date(),
  };
}
