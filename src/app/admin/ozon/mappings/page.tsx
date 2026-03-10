import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { deleteOzonMapping } from "@/actions/ozon/mapping/delete";
import { RiEdit2Line } from "react-icons/ri";

export default async function OzonMappingsPage() {
  const mappings = await db.ozonMapping.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Маппинг товаров Ozon</h1>
          <div className="mt-6 flex justify-end">
            <Link className="link-button link-button-green" href="/admin/ozon/mappings/create">
              Добавить маппинг
            </Link>
          </div>

          <div className="mt-6">
            {mappings.length === 0 ? (
              <p className="text-slate-400 text-sm">Маппингов пока нет</p>
            ) : (
              mappings.map((m) => (
                <div key={m.id} className="border rounded-md mb-1 p-3 shadow-main">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 font-medium">
                      <span>{m.product.sku}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-sky-700">{m.ozonOfferId}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/ozon/mappings/update/${m.id}`}>
                        <RiEdit2Line className="w-5 h-5 hover:text-blue-700 hover:scale-125 cursor-pointer" />
                      </Link>
                      <DeleteDialog
                        id={m.id}
                        action={deleteOzonMapping}
                        message={`Удалить маппинг ${m.product.sku} → ${m.ozonOfferId}?`}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 mt-0.5 flex gap-4">
                    {m.buffer != null && <span>буфер: {m.buffer} шт.</span>}
                    {m.divisor != null && <span>делитель: {m.divisor}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
