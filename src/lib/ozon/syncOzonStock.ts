import { db } from "@/db";

const OZON_API_BASE = "https://api-seller.ozon.ru";

export async function syncOzonStock(trigger: "AUTO" | "MANUAL"): Promise<void> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error(
      "Не заданы переменные окружения OZON_CLIENT_ID или OZON_API_KEY",
    );
  }

  const [bufferSetting, divisorSetting, warehouseSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "ozonDefaultBuffer" } }),
    db.settings.findUnique({ where: { field: "ozonDefaultDivisor" } }),
    db.settings.findUnique({ where: { field: "ozonWarehouseId" } }),
  ]);

  const globalBuffer = bufferSetting
    ? parseInt(bufferSetting.value, 10) || 0
    : 0;

  if (!divisorSetting) {
    throw new Error(
      "Не задан глобальный делитель (ozonDefaultDivisor). Укажите его в настройках Ozon.",
    );
  }
  const globalDivisor = parseInt(divisorSetting.value, 10);
  if (isNaN(globalDivisor) || globalDivisor < 1) {
    throw new Error(
      "Некорректное значение глобального делителя. Укажите целое число ≥ 1.",
    );
  }

  if (!warehouseSetting?.value) {
    throw new Error(
      "Не задан ID склада Ozon (ozonWarehouseId). Укажите его в настройках Ozon.",
    );
  }
  const warehouseId = parseInt(warehouseSetting.value, 10);
  if (isNaN(warehouseId)) {
    throw new Error("Некорректный ID склада Ozon. Укажите числовой ID.");
  }

  const mappings = await db.ozonMapping.findMany({
    include: {
      product: {
        include: { productVariants: { select: { availableQuantity: true } } },
      },
    },
  });

  if (mappings.length === 0) {
    await db.ozonSyncLog.create({
      data: {
        status: "SUCCESS",
        trigger,
        message: "Нет маппингов для синхронизации",
        skuCount: 0,
      },
    });
    return;
  }

  const stocks = mappings.map((mapping) => {
    const totalAvailable = mapping.product.productVariants.reduce(
      (sum, v) => sum + v.availableQuantity,
      0,
    );
    const effectiveBuffer = mapping.buffer ?? globalBuffer;
    const effectiveDivisor = mapping.divisor ?? globalDivisor;
    const stock = Math.max(
      0,
      Math.floor((totalAvailable - effectiveBuffer) / effectiveDivisor),
    );
    return { offer_id: mapping.ozonOfferId, stock, warehouse_id: warehouseId };
  });

  console.log(JSON.stringify({ stocks }));

  const response = await fetch(`${OZON_API_BASE}/v2/products/stocks`, {
    method: "POST",
    headers: {
      "Client-Id": clientId,
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stocks }),
  });

  const rawText = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    const message = `Ozon вернул невалидный ответ (HTTP ${response.status}): ${rawText.slice(0, 300)}`;
    await db.ozonSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: stocks.length },
    });
    throw new Error(message);
  }

  if (!response.ok) {
    const message = (data.message as string) || `HTTP ${response.status}`;
    await db.ozonSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: stocks.length },
    });
    throw new Error(message);
  }

  type OzonResultItem = { updated: boolean; errors: unknown[] };
  const failed = ((data.result as OzonResultItem[]) ?? []).filter(
    (item) => !item.updated || item.errors?.length > 0,
  );

  if (failed.length > 0) {
    const message = `${failed.length} из ${stocks.length} SKU не обновлены`;
    await db.ozonSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: stocks.length },
    });
    throw new Error(message);
  }

  await db.ozonSyncLog.create({
    data: { status: "SUCCESS", trigger, skuCount: stocks.length },
  });
}
