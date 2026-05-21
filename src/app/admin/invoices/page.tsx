import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { CreateInvoiceForm } from "@/components/admin/invoice/CreateInvoiceForm";
import { InvoicesGrid } from "@/components/admin/invoice/InvoicesGrid";
import { InvoiceTypeEnum, PriceTypeEnum, ProductStatusEnum } from "@prisma/client";

const SELLER_FIELDS = [
  "sellerLegalName",
  "sellerInn",
  "sellerKpp",
  "sellerBankName",
  "sellerShortBankName",
  "sellerBik",
  "sellerBankAccNo",
  "sellerAccNo",
] as const;

export default async function InvoicesPage() {
  const year = new Date().getFullYear();

  const [invoices, partners, orders, products, settingsRows, lastCashInvoice, lastBankInvoice, usdRateSetting, rmbRateSetting] =
    await Promise.all([
      db.invoice.findMany({
        orderBy: [{ year: "desc" }, { sequenceNumber: "desc" }],
        include: {
          partner: {
            include: {
              names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
            },
          },
          items: {
            include: {
              product: { select: { sku: true } },
              productVariant: { select: { variantName: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      db.partner.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
          legalEntities: { orderBy: { createdAt: "asc" } },
        },
      }),
      db.order.findMany({
        orderBy: [{ year: "desc" }, { sequenceNumber: "desc" }],
        select: { id: true, year: true, sequenceNumber: true },
        take: 200,
      }),
      db.product.findMany({
        where: { status: ProductStatusEnum.ACTIVE },
        orderBy: { sku: "asc" },
        include: {
          productVariants: { orderBy: [{ isMain: "desc" }, { variantName: "asc" }] },
          prices: { where: { type: { in: [PriceTypeEnum.DEALER, PriceTypeEnum.RETAIL] } } },
        },
      }),
      db.settings.findMany({ where: { field: { in: [...SELLER_FIELDS] } } }),
      db.invoice.findFirst({
        where: { year, invoiceType: InvoiceTypeEnum.CASH },
        orderBy: { sequenceNumber: "desc" },
        select: { sequenceNumber: true },
      }),
      db.invoice.findFirst({
        where: { year, invoiceType: InvoiceTypeEnum.BANK },
        orderBy: { sequenceNumber: "desc" },
        select: { sequenceNumber: true },
      }),
      db.settings.findUnique({ where: { field: "usdMainRate" } }),
      db.settings.findUnique({ where: { field: "rmbOfficialRate" } }),
    ]);

  const get = (field: string) =>
    settingsRows.find((r) => r.field === field)?.value ?? "";

  const sellerSettings = {
    sellerLegalName: get("sellerLegalName"),
    sellerInn: get("sellerInn"),
    sellerKpp: get("sellerKpp"),
    sellerBankName: get("sellerBankName"),
    sellerShortBankName: get("sellerShortBankName"),
    sellerBik: get("sellerBik"),
    sellerBankAccNo: get("sellerBankAccNo"),
    sellerAccNo: get("sellerAccNo"),
  };

  const nextCashSeqNum = (lastCashInvoice?.sequenceNumber ?? 0) + 1;
  const nextBankSeqNum = (lastBankInvoice?.sequenceNumber ?? 0) + 1;

  const partnerOptions = partners.map((p) => ({
    id: p.id,
    names: p.names.map((n) => n.name),
    legalEntities: p.legalEntities.map((le) => ({
      id: le.id,
      name: le.name,
      inn: le.inn,
      kpp: le.kpp,
      bankName: le.bankName,
      bik: le.bik,
      checkingAccount: le.checkingAccount,
      correspondentAccount: le.correspondentAccount,
    })),
  }));

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    length_mm: p.length_mm,
    width_mm: p.width_mm,
    productVariants: p.productVariants.map((v) => ({
      id: v.id,
      variantName: v.variantName,
      isMain: v.isMain,
    })),
    prices: p.prices.map((pr) => ({
      type: pr.type,
      priceInCents: pr.priceInCents,
      currency: pr.currency,
      unit: pr.unit,
    })),
  }));

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto px-4 pb-16">
        <h1 className="admin-form-header mt-10">Счета</h1>

        <InvoicesGrid
          invoices={invoices}
          partners={partnerOptions}
          orders={orders}
          products={productOptions}
          sellerSettings={sellerSettings}
          usdRate={usdRateSetting ? parseFloat(usdRateSetting.value) : null}
          rmbRate={rmbRateSetting ? parseFloat(rmbRateSetting.value) : null}
        />

        <div className="mt-8 border-t border-slate-200 pt-2">
          <CreateInvoiceForm
            partners={partnerOptions}
            orders={orders}
            products={productOptions}
            sellerSettings={sellerSettings}
            nextCashSeqNum={nextCashSeqNum}
            nextBankSeqNum={nextBankSeqNum}
            usdRate={usdRateSetting ? parseFloat(usdRateSetting.value) : null}
            rmbRate={rmbRateSetting ? parseFloat(rmbRateSetting.value) : null}
          />
        </div>
      </div>
    </>
  );
}
