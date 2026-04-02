import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { deleteYandexMapping } from "@/actions/yandex/mapping/delete";
import { RiEdit2Line } from "react-icons/ri";
import { RecalculateYandexPricesButton } from "@/components/admin/yandex/RecalculateYandexPricesButton";

export default async function YandexMappingsPage() {
  const mappings = await db.yandexMarketMapping.findMany({
    include: {
      product: {
        include: { prices: { where: { type: "YANDEX" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Маппинг товаров</h1>
          <div className="mt-6 flex justify-end items-center gap-3">
            <RecalculateYandexPricesButton />
            <Link className="link-button link-button-green" href="/admin/yandex/mappings/create">
              Добавить маппинг
            </Link>
          </div>

          <div className="mt-6">
            {mappings.length === 0 ? (
              <p className="text-slate-400 text-sm">Маппингов пока нет</p>
            ) : (
              mappings.map((m) => {
                const yandexPrice = m.product.prices[0];
                return (
                <div key={m.id} className="border rounded-md mb-1 p-3 shadow-main">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 font-medium">
                      <span>{m.product.sku}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-sky-700">{m.yandexSku}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/yandex/mappings/update/${m.id}`}>
                        <RiEdit2Line className="w-5 h-5 hover:text-blue-700 hover:scale-125 cursor-pointer" />
                      </Link>
                      <DeleteDialog
                        id={m.id}
                        action={deleteYandexMapping}
                        message={`Удалить маппинг ${m.product.sku} → ${m.yandexSku}?`}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 mt-0.5 flex gap-3 flex-wrap">
                    {yandexPrice ? (
                      <span className="text-emerald-700 font-medium">
                        {Math.round(yandexPrice.priceInCents / 100).toLocaleString("ru-RU")} ₽
                        {yandexPrice.quantity > 1 && ` / ${yandexPrice.quantity} шт.`}
                      </span>
                    ) : (
                      <span className="text-slate-300">цена не рассчитана</span>
                    )}
                    {m.buffer != null && <span>буфер: {m.buffer} шт.</span>}
                    {m.divisor != null && <span>делитель: {m.divisor}</span>}
                    {m.priceMarkup != null && <span>наценка: {m.priceMarkup}%</span>}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
