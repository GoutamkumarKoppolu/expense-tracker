// In-app explanations shown by <InfoButton topic="..." />. Keep them short
// and concrete: what it is, why it exists, one example.
export const HELP = {
  balanceDeduction: {
    title: "Deduct from current balance",
    body: [
      "Turn this on when the money you're saving comes out of your own balance, e.g. part of your salary. Your current balance goes down by that amount.",
      "Turn it off for money that comes from someone else, like money a family member or friend gives you to keep. It still counts as savings, but it doesn't reduce your balance, because it was never part of it.",
    ],
    example: "Balance ₹5,000. Save ₹1,000 from salary → balance ₹4,000. Save ₹2,000 you were given → balance stays ₹4,000. Total savings: ₹3,000.",
  },
  savings: {
    title: "Why savings are tracked separately",
    body: [
      "Not all savings come from your earnings. Some you set aside from your salary; some is money other people give you that you keep aside.",
      "Savings are grouped into pots by tag, so you can see exactly how much you saved from your salary, how much from money you were given, and so on, and how much of each you've already used.",
      "Using savings lowers that pot. It never changes your current balance.",
    ],
    example: "Pot \"Salary savings\": ₹5,000. Pot \"Gift money\": ₹2,000 you were given. Spend ₹1,500 from \"Salary savings\" → ₹3,500 left there, the ₹2,000 in \"Gift money\" untouched.",
  },
  creditCards: {
    title: "Why credit cards have their own page",
    body: [
      "Card statements often don't make it clear what each amount was spent on.",
      "Log card spends here as you make them, with a short description. When the bill arrives, compare the month's logged total with the statement: any difference is a spend you forgot to log or a charge you should check.",
      "These entries are kept separate from your balance, so nothing is counted twice.",
    ],
    example: "Logged this month: ₹12,400. Statement: ₹13,150. The ₹750 difference is worth a look.",
  },
  backup: {
    title: "Why back up",
    body: [
      "Your data lives only on this device. Uninstalling the app, clearing its storage or switching phones removes it, and there's no server copy.",
      "Export saves everything to a single file. Keep it somewhere safe, then use Import on the new install to get it all back.",
      "Backups from older versions of the app still work: anything new is filled in with sensible defaults, and the file is checked before anything on your device changes.",
    ],
    example: "Before a phone reset: More → Backup & restore → Export → save to Drive. After reinstalling: Import → pick that file → Replace my data.",
  },
  budgets: {
    title: "How budgets work",
    body: [
      "Make a budget for something you're planning, like a wedding, a function or a new car, and note down each amount you spend on it. You always see how much is left.",
      "You can split the total into sub-budgets. A spend can come from a sub-budget or straight from the whole budget; either way it's taken off the total. Going over is allowed: the amount left just turns red.",
      "Budgets are only a plan. They don't change your current balance, so log real expenses on Home as usual. When it's over, tap Mark as done to move it out of the way.",
    ],
    example: "Car: ₹10L, split into Purchase ₹5L, Modifications ₹3L and Repair ₹1L (₹1L unallocated). Spend ₹40,000 on modifications → Modifications ₹2.6L left, Car ₹9.6L left.",
  },
  subBudgets: {
    title: "Sub-budgets",
    body: [
      "Sub-budgets split a budget into parts, so you can see how each part is going. They're optional.",
      "Each sub-budget has its own amount. Spending from one reduces that sub-budget and the whole budget. \"Unallocated\" is the part of the total you haven't given to any sub-budget yet. If the sub-budgets add up to more than the total, it shows how much you've over-allocated.",
      "Tap a sub-budget to see only its spends, and to edit or delete it.",
    ],
    example: "Wedding ₹8L: Venue ₹3L, Catering ₹2.5L, Clothes ₹1.5L → ₹1L unallocated. Spend ₹50,000 on catering → Catering ₹2L left, Wedding ₹7.5L left.",
  },
  bills: {
    title: "Keeping bills",
    body: [
      "Keep photos and PDFs of bills you may need later, like invoices, warranties, receipts or service records, sorted into folders you name.",
      "Add a bill by taking a photo or choosing files. A bill can have several pages: a two-page invoice stays together as one bill. Files are kept exactly as you added them; nothing inside them is read.",
      "Tap a photo or Open on a PDF to view it in your phone's own viewer, where you can zoom. Share sends the whole bill to another app.",
      "Bills are stored only on this device and are included in your backup file, so export a backup before changing phones.",
    ],
    example: "Folder \"Warranties\": \"Fridge invoice\" (2 photos) and \"TV warranty card\" (a PDF). When the fridge needs repair, open the folder and show the invoice.",
  },
  tags: {
    title: "How tags help",
    body: [
      "A tag groups related transactions, even across months. Use the same tag every time and you can see all of them together, with the total.",
      "Open More → Tags to see every tag, grouped by expenses, savings and income, or pick tags in the Home filters.",
    ],
    example: "Tag every trip expense \"Goa trip\", or each of 12 monthly EMIs \"Car loan\", then open that tag to see them all.",
  },
};
