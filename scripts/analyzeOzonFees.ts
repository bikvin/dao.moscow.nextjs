import "dotenv/config";
import { fetchOzonPostings } from "../src/lib/ozon/fetchOzonPostings";
import { fetchOzonTransactions, getOzonService } from "../src/lib/ozon/fetchOzonTransactions";

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

  // Fetch transactions for all delivered postings
  const postingNumbers = delivered.map((p) => p.posting_number);
  console.log(`Fetching transactions for ${postingNumbers.length} postings...`);
  const txFrom = new Date(fromDate);
  const txTo = new Date(toDate);
  txTo.setDate(txTo.getDate() + 14); // buffer for late settlement
  const transactions = await fetchOzonTransactions(txFrom, txTo, postingNumbers);

  // Group transactions by posting
  const txByPosting = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const num = tx.posting?.posting_number;
    if (!num) continue;
    if (!txByPosting.has(num)) txByPosting.set(num, []);
    txByPosting.get(num)!.push(tx);
  }

  console.log(`\n${"posting".padEnd(24)} | ozon_units | buyer_total | payout | logistics | dropoff | lastMile | stars | acquiring | total_fees | fee/unit`);
  console.log("-".repeat(130));

  let totalRows = 0;
  for (const posting of delivered) {
    const txList = txByPosting.get(posting.posting_number) ?? [];
    const mainTx = txList.find((tx) => tx.operation_type === "OperationAgentDeliveredToCustomer");
    if (!mainTx) continue; // no transaction data yet

    const ozonUnits = posting.products.reduce((s, p) => s + p.quantity, 0);
    const financialProducts = posting.financial_data?.products ?? [];
    const totalPayout = financialProducts.reduce((s, fp) => s + fp.payout, 0);
    const buyerTotal = financialProducts.reduce((s, fp) => s + fp.price * fp.quantity, 0)
      || posting.products.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0);

    const allServices = txList.flatMap((tx) => tx.services);
    const logisticsRub = Math.abs(
      getOzonService(allServices, "MarketplaceServiceItemDirectFlowLogistic") +
      getOzonService(allServices, "MarketplaceServiceItemDeliveryToHandoverPlaceOzon")
    );
    const dropoffRub = Math.abs(
      getOzonService(allServices, "MarketplaceServiceItemDropoffPVZ") +
      getOzonService(allServices, "MarketplaceServiceItemRedistributionDropOffApvz")
    );
    const lastMileRub = Math.abs(getOzonService(allServices, "MarketplaceServiceItemRedistributionLastMileCourier"));
    const starsMembershipRub = Math.abs(getOzonService(allServices, "ItemAgentServiceStarsMembership"));
    const acquiringRub = Math.abs(getOzonService(allServices, "MarketplaceRedistributionOfAcquiringOperation"));
    const totalFees = logisticsRub + dropoffRub + lastMileRub + starsMembershipRub + acquiringRub;

    if (totalFees === 0) continue; // no fee data

    const feePerUnit = totalFees / ozonUnits;

    console.log([
      posting.posting_number.padEnd(24),
      String(ozonUnits).padStart(10),
      String(Math.round(buyerTotal)).padStart(11),
      String(Math.round(totalPayout)).padStart(6),
      logisticsRub.toFixed(1).padStart(9),
      dropoffRub.toFixed(1).padStart(7),
      lastMileRub.toFixed(1).padStart(8),
      starsMembershipRub.toFixed(1).padStart(5),
      acquiringRub.toFixed(1).padStart(9),
      totalFees.toFixed(1).padStart(10),
      feePerUnit.toFixed(1).padStart(8),
    ].join(" | "));

    totalRows++;
  }

  console.log(`\nShowing ${totalRows} settled deliveries with fee data.`);
}

main().catch(console.error);
