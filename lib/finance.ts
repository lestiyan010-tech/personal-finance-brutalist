import { TxType } from "@prisma/client";

export function normalizeCategory(title: string, category?: string | null) {
  const normalizedTitle = (title || "").toLowerCase();

  if (normalizedTitle.includes("winaudah") || normalizedTitle.includes("lailatul azizah")) {
    return "Transfer Keluarga";
  }

  if (normalizedTitle.includes("sasongko ari wibowo")) {
    return "sewa tempat tinggal";
  }

  return category || "Lainnya";
}

export function isMicroTransaction(amount?: number | null) {
  return amount === 1;
}

export function mapNotionType(type?: string | null): TxType {
  return type === "Pemasukan" ? TxType.INCOME : TxType.EXPENSE;
}
