import { ArrowDownLeft, ArrowUpRight, PiggyBank, Receipt } from "lucide-react";

// How each transaction kind looks in the UI (icon, color tone, amount sign).
export const KIND_META = {
  earning: { icon: ArrowDownLeft, tone: "positive", sign: "+" },
  expense: { icon: ArrowUpRight, tone: "negative", sign: "−" },
  saving: { icon: PiggyBank, tone: "savings", sign: "−" },
};

export const kindMeta = (kind) => KIND_META[kind] || { icon: Receipt, tone: "accent", sign: "" };
