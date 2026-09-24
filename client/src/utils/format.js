// Shared formatting and date helpers. Dates are always local-time
// "YYYY-MM-DD" / "YYYY-MM" strings (see CLAUDE.md data conventions).

export const currency = (n) => `₹${Number(n).toFixed(2)}`;

const pad2 = (n) => String(n).padStart(2, "0");

// Local date, not toISOString() (UTC), which returns yesterday before
// 05:30 in IST.
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const currentMonth = () => today().slice(0, 7);
