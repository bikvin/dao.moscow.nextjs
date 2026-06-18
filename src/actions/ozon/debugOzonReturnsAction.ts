"use server";

const OZON_API_BASE = "https://api-seller.ozon.ru";

type DebugState = {
  errors?: { _form?: string[] };
  success?: { message: string };
};

type OzonReturnRecord = {
  id: number;
  type: string;
  posting_number: string;
  order_number: string;
  return_reason_name: string;
  product: {
    offer_id: string;
    price: { price: number };
    price_without_commission: { price: number };
    commission_percent: number;
    commission: { price: number };
    quantity: number;
  };
  logistic: { return_date: string | null };
};

// Debug action: fetches 2 years of FBS returns, isolates ClientReturn type,
// then fetches transactions from /v3/finance/transaction/list for the first 5
// unique posting numbers to discover what return-related operation types exist
// and whether service fees are included.
export async function debugOzonReturnsAction(
  _state: DebugState,
  _formData: FormData
): Promise<DebugState> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) {
    return { errors: { _form: ["Не заданы OZON_CLIENT_ID или OZON_API_KEY"] } };
  }

  const headers = {
    "Client-Id": clientId,
    "Api-Key": apiKey,
    "Content-Type": "application/json",
  };

  const to = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  console.log("\n" + "=".repeat(70));
  console.log("=== OZON DEBUG: ClientReturn transactions ===");
  console.log("=".repeat(70));

  // Fetch 2 years of returns
  const res = await fetch(`${OZON_API_BASE}/v1/returns/list`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filter: {
        logistic_return_date: { time_from: twoYearsAgo.toISOString(), time_to: to.toISOString() },
        return_schema: "FBS",
      },
      limit: 500,
      last_id: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { errors: { _form: [`HTTP ${res.status}: ${(err as { message?: string }).message ?? "error"}`] } };
  }

  const data = await res.json();
  const allReturns: OzonReturnRecord[] = data.returns ?? [];
  const clientReturns = allReturns.filter((r) => r.type === "ClientReturn");

  console.log(`\nTotal returns: ${allReturns.length}, ClientReturn: ${clientReturns.length}`);

  if (clientReturns.length === 0) {
    console.log("No ClientReturn records found.");
    console.log("=".repeat(70) + "\n");
    return { success: { message: "ClientReturn записей не найдено." } };
  }

  // Collect all unique year-months from all ClientReturn dates (+ next month for settlement lag).
  // API limit is 1 month per request, so we query month by month.
  const months = new Set<string>();
  for (const r of clientReturns) {
    const d = r.logistic.return_date ?? null;
    if (d) {
      months.add(d.slice(0, 7));
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      months.add(next.toISOString().slice(0, 7));
      // Some return logistics settle even later — add +2 months too
      next.setMonth(next.getMonth() + 1);
      months.add(next.toISOString().slice(0, 7));
    }
  }

  type TxOp = {
    operation_type: string;
    amount: number;
    type: string;
    services: { name: string; price: number }[];
    posting?: { posting_number?: string };
  };

  const allReturnOps: TxOp[] = [];
  console.log(`\nScanning ${months.size} months for return transactions...`);

  for (const ym of [...months].sort()) {
    const [y, m] = ym.split("-").map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1));
    const toMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    let page = 1;
    while (true) {
      const txRes = await fetch(`${OZON_API_BASE}/v3/finance/transaction/list`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          filter: {
            date: { from: from.toISOString(), to: toMonth.toISOString() },
            transaction_type: "all",
          },
          page,
          page_size: 1000,
        }),
      });
      const txData = await txRes.json();
      if (!txRes.ok) {
        console.log(`  ${ym} page ${page} error: ${JSON.stringify(txData)}`);
        break;
      }
      const ops: TxOp[] = txData.result?.operations ?? [];
      // Keep only return-type operations
      allReturnOps.push(...ops.filter((op) => op.type === "returns"));
      if (page >= (txData.result?.page_count ?? 1) || ops.length === 0) break;
      page++;
    }
    console.log(`  ${ym}: done`);
  }

  console.log(`\nTotal return-type operations: ${allReturnOps.length}`);

  // Group by operation_type and compute per-transaction averages
  const byType = new Map<string, { amounts: number[]; serviceAmounts: Map<string, number[]> }>();
  for (const op of allReturnOps) {
    if (!byType.has(op.operation_type)) {
      byType.set(op.operation_type, { amounts: [], serviceAmounts: new Map() });
    }
    const bucket = byType.get(op.operation_type)!;
    bucket.amounts.push(op.amount);
    for (const svc of op.services ?? []) {
      if (!bucket.serviceAmounts.has(svc.name)) bucket.serviceAmounts.set(svc.name, []);
      bucket.serviceAmounts.get(svc.name)!.push(svc.price);
    }
  }

  const avg = (arr: number[]) => arr.reduce((s, n) => s + n, 0) / arr.length;

  console.log("\nPer operation_type averages (amount per transaction):");
  for (const [type, { amounts, serviceAmounts }] of [...byType.entries()].sort((a, b) => b[1].amounts.length - a[1].amounts.length)) {
    console.log(`\n  ${type}  (n=${amounts.length})`);
    console.log(`    avg amount: ${avg(amounts).toFixed(2)}  min: ${Math.min(...amounts).toFixed(2)}  max: ${Math.max(...amounts).toFixed(2)}`);
    for (const [svcName, prices] of serviceAmounts) {
      const nonZero = prices.filter((p) => p !== 0);
      console.log(`    service ${svcName}: avg ${avg(prices).toFixed(2)} (${nonZero.length}/${prices.length} non-zero, avg non-zero: ${nonZero.length ? avg(nonZero).toFixed(2) : "—"})`);
    }
  }

  console.log("\n" + "=".repeat(70) + "\n");
  return {
    success: {
      message: `ClientReturn: ${clientReturns.length}. Транзакций (тип returns) за ${months.size} месяцев: ${allReturnOps.length} (${byType.size} типов). Детали в консоли.`,
    },
  };
}
