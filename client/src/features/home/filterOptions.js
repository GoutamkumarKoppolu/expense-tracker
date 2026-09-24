import { DEDUCTION_FILTERS, KIND_LABELS, TRANSACTION_KINDS } from "../../domain/transactions";

export const KIND_OPTIONS = [
  { value: "", label: "All" },
  ...TRANSACTION_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] })),
];

export const DEDUCTION_OPTIONS = [
  { value: DEDUCTION_FILTERS.ALL, label: "All" },
  { value: DEDUCTION_FILTERS.DEDUCTED, label: "From balance" },
  { value: DEDUCTION_FILTERS.NOT_DEDUCTED, label: "Not from balance" },
];
