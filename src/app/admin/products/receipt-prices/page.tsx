import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { UploadReceiptPricesForm } from "@/components/admin/product/receipt-prices/UploadReceiptPricesForm";
import { BackfillQuantityLeftButton } from "@/components/admin/product/receipt-prices/BackfillQuantityLeftButton";
import { BackfillIssueCostPricesButton } from "@/components/admin/product/receipt-prices/BackfillIssueCostPricesButton";
import Link from "next/link";

// Admin page for bulk-setting purchase prices on ProductReceipt records via Excel upload.
export default function ReceiptPricesPage() {
  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto pb-16">
          <h1 className="admin-form-header mt-10">Цены закупки</h1>

          <div className="border rounded-md p-6 shadow-main bg-white flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 font-medium">Шаг 1 — скачайте шаблон</p>
              <p className="text-sm text-slate-500">
                Файл содержит все артикулы. Заполните колонки <strong>price</strong>,{" "}
                <strong>priceCurrency</strong> (RUB / USD / RMB) и <strong>priceUnit</strong> (ITEM / M2).
              </p>
              <Link
                href="/admin/products/receipt-prices/download"
                className="inline-block mt-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Скачать шаблон Excel →
              </Link>
            </div>

            <hr className="border-slate-200" />

            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 font-medium">Шаг 2 — загрузите заполненный файл</p>
              <p className="text-sm text-slate-500">
                Все поступления для каждого артикула получат указанную цену. Строки с пустой или
                некорректной ценой будут пропущены.
              </p>
              <UploadReceiptPricesForm />
            </div>

            <hr className="border-slate-200" />

            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 font-medium">Служебное — разовые операции</p>
              <p className="text-sm text-slate-500">
                Заполняет поле «остаток» для всех приходов, у которых оно равно 0. Запускать один раз
                после первоначального заполнения цен.
              </p>
              <BackfillQuantityLeftButton />
              <p className="text-sm text-slate-500 mt-2">
                Рассчитывает себестоимость (ФИФО) для всех списаний, у которых она ещё не указана.
                Запускать после заполнения цен и остатков.
              </p>
              <BackfillIssueCostPricesButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
