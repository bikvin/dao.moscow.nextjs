import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { PriceListTable } from "@/components/admin/prices/PriceListTable";

export default async function PricesPage() {
  const [productGroups, mainRateSetting] = await Promise.all([
    db.productGroup.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      include: {
        products: {
          orderBy: [{ displayOrder: "asc" }, { sku: "asc" }],
          include: { prices: true, chipSize: true },
        },
      },
    }),
    db.settings.findUnique({ where: { field: "usdMainRate" } }),
  ]);

  const mainRate = mainRateSetting ? parseFloat(mainRateSetting.value) : null;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] mx-auto mt-10">
          <h2 className="text-xl font-semibold tracking-wide mb-4">Прайс-лист</h2>
          {mainRate === null && (
            <p className="text-sm text-amber-600 mb-4">
              Рабочий курс USD не задан — цены в рублях не будут рассчитаны.
            </p>
          )}
          <PriceListTable productGroups={productGroups} mainRate={mainRate} />
        </div>
      </div>
    </>
  );
}
