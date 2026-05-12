import { currentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type SummaryRow = {
  latest_snapshot_at: Date | null;
  latest_equity: unknown;
  prev_equity: unknown;
};

type PointRow = {
  snapshot_at: Date | null;
  total_equity: unknown;
  delta_value: unknown;
  delta_pct: unknown;
  market_delta: unknown;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [summary] = await prisma.$queryRaw<SummaryRow[]>`
    WITH totals AS (
      SELECT
        snapshot_at,
        SUM(equity_value) AS total_equity
      FROM equity_snapshots
      GROUP BY snapshot_at
    ),
    latest_points AS (
      SELECT
        snapshot_at,
        total_equity,
        ROW_NUMBER() OVER (ORDER BY snapshot_at DESC) AS rn
      FROM totals
      ORDER BY snapshot_at DESC
      LIMIT 2
    )
    SELECT
      MAX(CASE WHEN rn = 1 THEN snapshot_at END) AS latest_snapshot_at,
      MAX(CASE WHEN rn = 1 THEN total_equity END) AS latest_equity,
      MAX(CASE WHEN rn = 2 THEN total_equity END) AS prev_equity
    FROM latest_points;
  `;

  const points = await prisma.$queryRaw<PointRow[]>`
    WITH totals AS (
      SELECT
        snapshot_at,
        SUM(equity_value) AS total_equity,
        SUM(net_flow) AS total_net_flow
      FROM equity_snapshots
      GROUP BY snapshot_at
    ),
    changes AS (
      SELECT
        snapshot_at,
        total_equity,
        total_net_flow,
        total_equity - LAG(total_equity) OVER (ORDER BY snapshot_at) AS delta_value,
        CASE
          WHEN LAG(total_equity) OVER (ORDER BY snapshot_at) IS NULL
            OR LAG(total_equity) OVER (ORDER BY snapshot_at) = 0 THEN NULL
          ELSE ((total_equity - LAG(total_equity) OVER (ORDER BY snapshot_at)) / LAG(total_equity) OVER (ORDER BY snapshot_at)) * 100
        END AS delta_pct,
        (total_equity - LAG(total_equity) OVER (ORDER BY snapshot_at)) - total_net_flow AS market_delta
      FROM totals
    )
    SELECT snapshot_at, total_equity, delta_value, delta_pct, market_delta
    FROM changes
    ORDER BY snapshot_at DESC
    LIMIT 20;
  `;

  const latestEquity = toNumber(summary?.latest_equity) || 0;
  const prevEquity = toNumber(summary?.prev_equity);
  const deltaValue = prevEquity ? latestEquity - prevEquity : null;
  const deltaPct = prevEquity && deltaValue !== null ? (deltaValue / prevEquity) * 100 : null;

  return Response.json({
    latest_snapshot_at: summary?.latest_snapshot_at?.toISOString() || null,
    latest_equity: latestEquity,
    prev_equity: prevEquity,
    delta_value: deltaValue,
    delta_pct: deltaPct,
    points: points.map((point) => ({
      snapshot_at: point.snapshot_at?.toISOString() || null,
      total_equity: toNumber(point.total_equity) || 0,
      delta_value: toNumber(point.delta_value),
      delta_pct: toNumber(point.delta_pct),
      market_delta: toNumber(point.market_delta),
    })),
  });
}
