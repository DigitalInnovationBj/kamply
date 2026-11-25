import "server-only";
import { db } from "@/lib/db";

export type DayPoint = { date: string; reach: number; clicks: number; conversions: number; spend: number };
export type Totals = { reach: number; clicks: number; conversions: number; spend: number; impressions: number };

const DAY = 24 * 60 * 60 * 1000;

function startOfDayUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function emptyTotals(): Totals {
  return { reach: 0, clicks: 0, conversions: 0, spend: 0, impressions: 0 };
}

/**
 * Série quotidienne sur `days` jours (jours sans donnée = 0) + totaux de la période
 * et de la période précédente, pour calculer les variations.
 */
export async function getStatsSeries(where: { campaign: { userId?: string; id?: string } }, days = 30) {
  const today = startOfDayUTC();
  const from = new Date(today.getTime() - (days - 1) * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const rows = await db.campaignStat.findMany({
    where: { ...where, date: { gte: prevFrom, lte: today } },
    select: { date: true, reach: true, clicks: true, conversions: true, spend: true, impressions: true },
  });

  const byDay = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * DAY).toISOString().slice(0, 10);
    byDay.set(d, { date: d, reach: 0, clicks: 0, conversions: 0, spend: 0 });
  }
  const current = emptyTotals();
  const previous = emptyTotals();

  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    const target = r.date >= from ? current : previous;
    target.reach += r.reach;
    target.clicks += r.clicks;
    target.conversions += r.conversions;
    target.spend += r.spend;
    target.impressions += r.impressions;
    const p = byDay.get(key);
    if (p) {
      p.reach += r.reach;
      p.clicks += r.clicks;
      p.conversions += r.conversions;
      p.spend += r.spend;
    }
  }
  return { series: [...byDay.values()], current, previous, hasData: rows.some((r) => r.date >= from) };
}

export async function getWallet(userId: string) {
  const wallet = await db.wallet.upsert({ where: { userId }, update: {}, create: { userId } });
  const transactions = await db.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const pending = transactions.filter((t) => t.type === "TOPUP" && t.status === "PENDING").reduce((s, t) => s + t.amount, 0);
  return { wallet, transactions, pending };
}

export async function getDashboard(userId: string) {
  const [stats, campaigns, wallet] = await Promise.all([
    getStatsSeries({ campaign: { userId } }),
    db.campaign.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.wallet.upsert({ where: { userId }, update: {}, create: { userId } }),
  ]);
  const counts = await db.campaign.groupBy({ by: ["status"], where: { userId }, _count: true });
  return { stats, campaigns, wallet, counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number> };
}

export async function getCampaigns(userId: string) {
  return db.campaign.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getCampaign(userId: string, id: string) {
  const campaign = await db.campaign.findFirst({ where: { id, userId } });
  if (!campaign) return null;
  const stats = await getStatsSeries({ campaign: { id } });
  return { campaign, stats };
}

/* ---------------------------------------------------------------- Admin */

export async function getAdminOverview() {
  const [pendingCampaigns, pendingTopups, activeCampaigns, users] = await Promise.all([
    db.campaign.count({ where: { status: "PENDING_REVIEW" } }),
    db.walletTransaction.aggregate({ where: { type: "TOPUP", status: "PENDING", method: "BANK_TRANSFER" }, _count: true, _sum: { amount: true } }),
    db.campaign.count({ where: { status: "ACTIVE" } }),
    db.user.count(),
  ]);
  return { pendingCampaigns, pendingTopups: pendingTopups._count, pendingTopupsAmount: pendingTopups._sum.amount ?? 0, activeCampaigns, users };
}

export async function getAdminCampaigns(status?: string) {
  return db.campaign.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: [{ updatedAt: "desc" }],
    include: { user: { select: { name: true, email: true, companyName: true, image: true } } },
    take: 500,
  });
}

export async function getAdminCampaign(id: string) {
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, companyName: true, image: true, phone: true } } },
  });
  if (!campaign) return null;
  const [stats, entries] = await Promise.all([
    getStatsSeries({ campaign: { id } }),
    db.campaignStat.findMany({ where: { campaignId: id }, orderBy: { date: "desc" }, take: 60 }),
  ]);
  return { campaign, stats, entries };
}

export async function getPendingTopups() {
  return db.walletTransaction.findMany({
    where: { type: "TOPUP" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { wallet: { include: { user: { select: { name: true, email: true, companyName: true, image: true } } } } },
    take: 100,
  });
}

export async function getAdminUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, image: true, role: true, companyName: true, emailVerified: true, createdAt: true, banned: true, banReason: true, banExpires: true, wallet: { select: { balance: true } }, _count: { select: { campaigns: true } } },
    take: 500,
  });
}
