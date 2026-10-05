import "dotenv/config";
import { fetchOzonPostings } from "../src/lib/ozon/fetchOzonPostings";
import { fetchOzonAccrualsByPosting } from "../src/lib/ozon/fetchOzonTransactions";

async function main() {
  const fromDate = new Date("2026-02-01");
  const toDate = new Date("2026-04-30");

  console.log(`Fetching postings ${fromDate.toISOString().slice(0,10)} → ${toDate.toISOString().slice(0,10)}...`);
  const allPostings = await fetchOzonPostings({ fromDate, toDate });

  const delivered = allPostings.filter((p) => p.status === "delivered");
  console.log(`Total postings: ${allPostings.length}, delivered: ${delivered.length}\n`);

  if (delivered.length === 0) {
    console.log("No delivered postings found.");
    return;
  }

  const postingNumbers = delivered.map((p) => p.posting_number);
  console.log(`Fetching accruals for ${postingNumbers.length} postings...`);
  const accrualMap = await fetchOzonAccrualsByPosting(postingNumbers);

  console.log(`\n${"posting".padEnd(24)} | ozon_units | buyer_total | payout | total_fees | fee/unit`);
  console.log("-".repeat(90));

  let totalRows = 0;
  for (const posting of delivered) {
    const accruals = accrualMap.get(posting.posting_number);
    if (!accruals?.isSettled) continue;

    const ozonUnits = posting.products.reduce((s, p) => s + p.quantity, 0);
    const financialProducts = posting.financial_data?.products ?? [];
    const totalPayout = financialProducts.reduce((s, fp) => s + fp.payout, 0);
    const buyerTotal = financialProducts.reduce((s, fp) => s + fp.price * fp.quantity, 0)
      || posting.products.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0);
    const totalFees = accruals.totalFeesRub;

    if (totalFees === 0) continue;

    const feePerUnit = totalFees / ozonUnits;

    console.log([
      posting.posting_number.padEnd(24),
      String(ozonUnits).padStart(10),
      String(Math.round(buyerTotal)).padStart(11),
      String(Math.round(totalPayout)).padStart(6),
      totalFees.toFixed(1).padStart(10),
      feePerUnit.toFixed(1).padStart(8),
    ].join(" | "));

    totalRows++;
  }

  console.log(`\nShowing ${totalRows} settled deliveries with fee data.`);
}

main().catch(console.error);
