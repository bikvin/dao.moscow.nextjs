import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { InvoicesGrid } from "@/components/admin/invoice/InvoicesGrid";
import { InvoiceTypeEnum, PriceTypeEnum, ProductStatusEnum, PriceUnitEnum } from "@prisma/client";
import { type InitialOrder } from "@/components/admin/invoice/CreateInvoiceForm";
import { Pagination } from "@/components/admin/Pagination";

const PAGE_SIZE = 50;

const SELLER_FIELDS = [
  "sellerLegalName",
  "sellerInn",
  "sellerKpp",
  "sellerAddress",
  "sellerPhone",
  "sellerBankName",
  "sellerShortBankName",
  "sellerBik",
  "sellerBankAccNo",
  "sellerAccNo",
] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { fromOrderId?: string; editInvoiceId?: string; scrollToInvoiceId?: string; newInvoiceId?: string; tab?: string; page?: string };
}) {
  const year = new Date().getFullYear();
  const fromOrderId = searchParams.fromOrderId ?? null;
  const editInvoiceId = searchParams.editInvoiceId ?? null;
  const scrollToInvoiceId = searchParams.scrollToInvoiceId ?? null;
  const newInvoiceId = searchParams.newInvoiceId ?? null;
  const activeTab = searchParams.tab === "BANK" ? InvoiceTypeEnum.BANK : InvoiceTypeEnum.CASH;

  // When navigating to a newly created invoice, jump to the last page where it lives
  const [totalInvoices, cashCount, bankCount] = await Promise.all([
    db.invoice.count({ where: { invoiceType: activeTab } }),
    db.invoice.count({ where: { invoiceType: InvoiceTypeEnum.CASH } }),
    db.invoice.count({ where: { invoiceType: InvoiceTypeEnum.BANK } }),
  ]);

  const lastPage = Math.max(1, Math.ceil(totalInvoices / PAGE_SIZE));
  const currentPage = newInvoiceId && !searchParams.page
    ? lastPage
    : Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [invoices, partners, orders, products, settingsRows, lastCashInvoice, lastBankInvoice, usdRateSetting, rmbRateSetting, sourceOrder] =
    await Promise.all([
      db.invoice.findMany({
        where: { invoiceType: activeTab },
        orderBy: [{ year: "asc" }, { sequenceNumber: "asc" }],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
      fromOrderId ? db.order.findUnique({
        where: { id: fromOrderId },
        select: {
          id: true,
          partnerId: true,
          deliveryPriceRub: true,
          discountPercent: true,
          items: {
            select: {
              productId: true,
              productVariantId: true,
              quantity: true,
              quantityM2: true,
              priceUnit: true,
              priceRub: true,
              totalRub: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }) : Promise.resolve(null),
    ]);

  const get = (field: string) =>
    settingsRows.find((r) => r.field === field)?.value ?? "";

  const sellerSettings = {
    sellerLegalName: get("sellerLegalName"),
    sellerInn: get("sellerInn"),
    sellerKpp: get("sellerKpp"),
    sellerAddress: get("sellerAddress"),
    sellerPhone: get("sellerPhone"),
    sellerBankName: get("sellerBankName"),
    sellerShortBankName: get("sellerShortBankName"),
    sellerBik: get("sellerBik"),
    sellerBankAccNo: get("sellerBankAccNo"),
    sellerAccNo: get("sellerAccNo"),
  };

  const nextCashSeqNum = (lastCashInvoice?.sequenceNumber ?? 0) + 1;
  const nextBankSeqNum = (lastBankInvoice?.sequenceNumber ?? 0) + 1;
  const totalPages = lastPage;

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

  const initialOrder: InitialOrder | null = sourceOrder
    ? {
        id: sourceOrder.id,
        partnerId: sourceOrder.partnerId,
        deliveryPriceRub: sourceOrder.deliveryPriceRub,
        discountPercent: sourceOrder.discountPercent,
        items: sourceOrder.items.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          quantityM2: item.quantityM2,
          priceUnit: item.priceUnit as PriceUnitEnum,
          priceRub: item.priceRub,
          totalRub: item.totalRub,
        })),
      }
    : null;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto px-4 pb-16">
        <h1 className="admin-form-header mt-10">Счета и накладные</h1>

        <InvoicesGrid
          invoices={invoices}
          partners={partnerOptions}
          orders={orders}
          products={productOptions}
          sellerSettings={sellerSettings}
          nextCashSeqNum={nextCashSeqNum}
          nextBankSeqNum={nextBankSeqNum}
          usdRate={usdRateSetting ? parseFloat(usdRateSetting.value) : null}
          rmbRate={rmbRateSetting ? parseFloat(rmbRateSetting.value) : null}
          initialOrder={initialOrder}
          initialInvoiceId={editInvoiceId}
          scrollToInvoiceId={scrollToInvoiceId}
          newInvoiceId={newInvoiceId}
          activeTab={activeTab}
          cashCount={cashCount}
          bankCount={bankCount}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/admin/invoices"
          searchParams={{ tab: activeTab, fromOrderId: fromOrderId ?? undefined, editInvoiceId: editInvoiceId ?? undefined }}
        />
      </div>
    </>
  );
}
