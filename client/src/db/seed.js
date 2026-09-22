// Default rows, matching server/schema.sql's seed INSERTs exactly.
export async function seed(db) {
  await db.transaction_types.bulkAdd([
    { name: "expense", kind: "expense" },
    { name: "earning", kind: "earning" },
    { name: "saving", kind: "saving" },
  ]);
  await db.payment_methods.bulkAdd([{ name: "Cash" }, { name: "Card" }, { name: "UPI" }, { name: "Bank Transfer" }]);
  await db.payment_sources.bulkAdd([{ name: "PhonePe" }, { name: "Google Pay" }, { name: "Paytm" }]);
}
