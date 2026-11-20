import { STATUS, TX_STATUS, type CampaignStatusKey } from "@/lib/campaigns";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  signal: "bg-[#18cccd] text-black",
  brand: "bg-[#ff5b23]/15 text-[#bf3d0c]",
  dark: "bg-black text-[#f5f5f3]",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-destructive/12 text-destructive",
};

function Pill({ tone, children, live }: { tone: string; children: React.ReactNode; live?: boolean }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-bold", TONES[tone])}>
      {live && <span className="live-dot size-2" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: CampaignStatusKey }) {
  const s = STATUS[status];
  return (
    <Pill tone={s.tone} live={status === "ACTIVE"}>
      {s.label}
    </Pill>
  );
}

export function TxStatusBadge({ status }: { status: keyof typeof TX_STATUS }) {
  const s = TX_STATUS[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
