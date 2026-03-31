import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { ImportForm } from "@/components/admin/import/ImportForm";

export default function ImportPage() {
  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto mt-10">
          <h1 className="admin-form-header">Импорт цен и размеров чипа</h1>

          <div className="mb-8">
            <p className="text-slate-600 mb-4">
              Скачайте шаблон, заполните цены и размеры чипа, затем загрузите файл обратно.
              Товары сопоставляются по SKU. Размеры чипа создаются автоматически если не существуют.
            </p>
            <a
              href="/api/admin/import/template"
              className="link-button link-button-blue inline-flex"
            >
              Скачать шаблон
            </a>
          </div>

          <ImportForm />
        </div>
      </div>
    </>
  );
}
