"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PriceUnitEnum, InvoiceTypeEnum } from "@prisma/client";
import { Pencil } from "lucide-react";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteInvoice } from "@/actions/invoice/deleteInvoice";
import { CreateInvoiceForm, type InitialOrder } from "./CreateInvoiceForm";
import { type ProductOption } from "@/components/admin/order/AddOrderItemForm";

const COLS = "grid-cols-[72px_84px_148px_1fr_48px_68px_84px_88px]";

function formatRub(kopecks: number): string {
  return (
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(kopecks / 100) + " ₽"
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

function E() {
  return <div />;
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
  );
}

const TYPE_CONFIG: Record<InvoiceTypeEnum, { label: string; cls: string }> = {
  CASH: { label: "Наличные", cls: "bg-emerald-50 text-emerald-700" },
  BANK: { label: "Безналичные", cls: "bg-blue-50 text-blue-700" },
};

type PartnerOption = { id: string; names: string[]; legalEntities: { id: string; name: string; inn: string | null; kpp: string | null; legalAddress: string | null; phones: string | null; bankName: string | null; bik: string | null; checkingAccount: string | null; correspondentAccount: string | null }[] };
type OrderOption = { id: string; year: number; sequenceNumber: number };
type SellerSettings = { sellerLegalName: string; sellerInn: string; sellerKpp: string; sellerAddress: string; sellerPhone: string; sellerBankName: string; sellerShortBankName: string; sellerBik: string; sellerBankAccNo: string; sellerAccNo: string };

type InvoiceItem = {
  id: string;
  productId: string;
  productVariantId: string;
  quantity: number;
  quantityM2: number | null;
  priceUnit: PriceUnitEnum;
  priceRub: number;
  totalRub: number;
  product: { sku: string };
  productVariant: { variantName: string };
};

type Invoice = {
  id: string;
  year: number;
  sequenceNumber: number;
  invoiceDate: Date;
  invoiceType: InvoiceTypeEnum;
  partnerId: string;
  orderId: string | null;
  deliveryPriceRub: number;
  discountPercent: number;
  totalRub: number;
  buyerLegalName: string;
  buyerInn: string;
  buyerKpp: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerBankName: string;
  buyerBik: string;
  buyerBankAccNo: string;
  buyerAccNo: string;
  sellerLegalName: string;
  sellerInn: string;
  sellerKpp: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerBankName: string;
  sellerShortBankName: string;
  sellerBik: string;
  sellerBankAccNo: string;
  sellerAccNo: string;
  partner: { names: { name: string; isPrimary: boolean }[] };
  items: InvoiceItem[];
};

export function InvoicesGrid({
  invoices,
  partners,
  orders,
  products,
  sellerSettings,
  usdRate,
  rmbRate,
  nextCashSeqNum,
  nextBankSeqNum,
  initialOrder,
  initialInvoiceId,
  scrollToInvoiceId,
  newInvoiceId,
  activeTab,
  cashCount,
  bankCount,
}: {
  invoices: Invoice[];
  partners: PartnerOption[];
  orders: OrderOption[];
  products: ProductOption[];
  sellerSettings: SellerSettings;
  usdRate: number | null;
  rmbRate: number | null;
  nextCashSeqNum: number;
  nextBankSeqNum: number;
  initialOrder?: InitialOrder | null;
  initialInvoiceId?: string | null;
  scrollToInvoiceId?: string | null;
  newInvoiceId?: string | null;
  activeTab: InvoiceTypeEnum;
  cashCount: number;
  bankCount: number;
}) {
  const initialInvoice = initialInvoiceId
    ? invoices.find((inv) => inv.id === initialInvoiceId) ?? null
    : null;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(
    initialInvoice?.id ?? null,
  );
  const createFormRef = React.useRef<HTMLDivElement>(null);
  const editInvoiceRef = React.useRef<HTMLDivElement>(null);
  const scrollInvoiceRef = React.useRef<HTMLDivElement>(null);
  const newInvoiceRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialOrder && createFormRef.current) {
      createFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialOrder]);

  React.useEffect(() => {
    if (initialInvoice && editInvoiceRef.current) {
      editInvoiceRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialInvoice]);

  React.useEffect(() => {
    if (scrollToInvoiceId && scrollInvoiceRef.current) {
      scrollInvoiceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scrollToInvoiceId]);

  React.useEffect(() => {
    if (newInvoiceId && newInvoiceRef.current) {
      newInvoiceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [newInvoiceId]);

  const TAB_CONFIG: { type: InvoiceTypeEnum; label: string; count: number }[] = [
    { type: InvoiceTypeEnum.CASH, label: "Наличные", count: cashCount },
    { type: InvoiceTypeEnum.BANK, label: "Безналичные", count: bankCount },
  ];

  return (
    <div className="mt-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {TAB_CONFIG.map(({ type, label, count }) => {
          const isActive = activeTab === type;
          return (
            <Link
              key={type}
              href={`/admin/invoices?tab=${type}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 && (
        <p className="text-sm text-slate-400 mt-6">Счетов пока нет</p>
      )}
      {invoices.length > 0 && <>
      {/* Sticky column headers */}
      <div className="hidden md:flex sticky top-0 bg-white z-10 border-b-2 border-slate-300 text-xs text-slate-400 mb-2 mx-px">
        <div className={`flex-1 min-w-0 grid ${COLS} gap-x-3 px-3 py-1.5`}>
          <div>#</div>
          <div>Дата</div>
          <div>Партнёр</div>
          <div>Товар</div>
          <div className="text-right">Кол</div>
          <div className="text-right">М²</div>
          <div className="text-right">Цена</div>
          <div className="text-right">Сумма</div>
        </div>
        <div className="w-36 flex-shrink-0" />
      </div>

      <div className="flex flex-col">
        {invoices.map((inv) => {
          const partnerName =
            inv.partner.names.find((n) => n.isPrimary)?.name ??
            inv.partner.names[0]?.name ??
            "—";

          return (
            <div
              key={inv.id}
              ref={inv.id === initialInvoice?.id ? editInvoiceRef : inv.id === scrollToInvoiceId ? scrollInvoiceRef : inv.id === newInvoiceId ? newInvoiceRef : undefined}
              className={`relative border rounded-md shadow-main overflow-hidden mb-3${inv.id === scrollToInvoiceId || inv.id === newInvoiceId ? " highlight-flash" : ""}`}
            >
              <div className="absolute top-2 right-2 z-10">
                <DeleteItemButton
                  action={deleteInvoice}
                  fields={{ id: inv.id }}
                  message={`Удалить счёт №${inv.sequenceNumber}/${inv.year}?`}
                />
              </div>
              <div className="relative flex flex-col md:flex-row md:items-start">
              <button
                type="button"
                onClick={() => setOpenInvoiceId(openInvoiceId === inv.id ? null : inv.id)}
                className="absolute bottom-2 left-2 z-10 text-slate-400 hover:text-blue-500"
                title="Редактировать"
              >
                <Pencil className="w-5 h-5" />
              </button>
                {/* Desktop grid */}
                <div
                  className={`hidden md:grid flex-1 min-w-0 ${COLS} gap-x-3 px-3 py-2 items-start`}
                >
                  {inv.items.length === 0 ? (
                    <>
                      <div className="py-0.5 text-sm font-semibold leading-tight">
                        <div>{inv.sequenceNumber}</div>
                        {inv.orderId && (() => {
                          const o = orders.find((o) => o.id === inv.orderId);
                          return o ? <Link href={`/admin?status=ALL&scrollToOrder=${inv.orderId}`} className="text-xs text-slate-400 font-normal hover:text-blue-500 hover:underline">зак. {o.sequenceNumber}</Link> : null;
                        })()}
                      </div>
                      <div className="text-sm text-slate-600 py-0.5">
                        {formatDate(inv.invoiceDate)}
                      </div>
                      <div className="text-sm py-0.5">{partnerName}</div>
                      <div className="col-span-5 text-sm text-slate-400 italic py-0.5">
                        Нет позиций
                      </div>
                    </>
                  ) : (
                    <>
                      {inv.items.map((item, idx) => (
                        <React.Fragment key={item.id}>
                          {idx === 0 ? (
                            <>
                              <div className="py-0.5 text-sm font-semibold leading-tight">
                                <div>{inv.sequenceNumber}</div>
                                {inv.orderId && (() => {
                                  const o = orders.find((o) => o.id === inv.orderId);
                                  return o ? <Link href={`/admin?status=ALL&scrollToOrder=${inv.orderId}`} className="text-xs text-slate-400 font-normal hover:text-blue-500 hover:underline">зак. {o.sequenceNumber}</Link> : null;
                                })()}
                              </div>
                              <div className="text-sm text-slate-600 py-0.5">
                                {formatDate(inv.invoiceDate)}
                              </div>
                              <div className="text-sm py-0.5">{partnerName}</div>
                            </>
                          ) : (
                            <>
                              <E />
                              <E />
                              <E />
                            </>
                          )}
                          <div className="text-sm py-0.5">
                            {item.product.sku}
                            {item.productVariant.variantName && (
                              <span className="text-slate-400 ml-1 text-xs">
                                ({item.productVariant.variantName})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-right py-0.5">
                            {item.quantity}
                          </div>
                          <div className="text-sm text-right py-0.5">
                            {item.quantityM2 !== null
                              ? item.quantityM2.toFixed(2)
                              : "—"}
                          </div>
                          <div className="text-sm text-right py-0.5">
                            {formatRub(item.priceRub)}
                          </div>
                          <div className="text-sm text-right py-0.5">
                            {formatRub(item.totalRub)}
                          </div>
                        </React.Fragment>
                      ))}

                      {inv.discountPercent > 0 && (() => {
                        const itemsSubtotal = inv.items.reduce((s, i) => s + i.totalRub, 0);
                        const discountAmount = Math.round(itemsSubtotal * inv.discountPercent / 100);
                        return (
                          <>
                            <E /><E /><E />
                            <div className="text-sm text-slate-500 italic py-0.5">
                              Скидка {inv.discountPercent}%
                            </div>
                            <E /><E /><E />
                            <div className="text-sm text-right py-0.5 text-slate-500">
                              −{formatRub(discountAmount)}
                            </div>
                          </>
                        );
                      })()}

                      {inv.deliveryPriceRub > 0 && (
                        <>
                          <E /><E /><E />
                          <div className="text-sm text-slate-500 italic py-0.5">
                            Доставка
                          </div>
                          <E /><E /><E />
                          <div className="text-sm text-right py-0.5 text-slate-600">
                            {formatRub(inv.deliveryPriceRub)}
                          </div>
                        </>
                      )}

                      <>
                        <E />
                        <div className="col-span-2 text-xs text-slate-500 italic py-1 border-t border-slate-200 flex items-center">
                          {inv.buyerLegalName || null}
                        </div>
                        <div className="text-sm font-semibold py-1 border-t border-slate-200">
                          Итого
                        </div>
                        <E /><E /><E />
                        <div className="text-sm font-semibold text-right py-1 border-t border-slate-200">
                          {formatRub(inv.totalRub)}
                        </div>
                      </>
                    </>
                  )}
                </div>

                {/* Mobile layout */}
                <div className="flex-1 md:hidden flex flex-col px-3 py-2 gap-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-semibold mr-2">
                        №{inv.sequenceNumber}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatDate(inv.invoiceDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">{partnerName}</div>
                  {inv.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-baseline justify-between text-sm gap-2"
                    >
                      <div>
                        {item.product.sku}
                        {item.productVariant.variantName && (
                          <span className="text-slate-400 ml-1 text-xs">
                            ({item.productVariant.variantName})
                          </span>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap text-slate-600">
                        {item.quantity} шт · {formatRub(item.totalRub)}
                      </div>
                    </div>
                  ))}
                  {inv.discountPercent > 0 && (() => {
                    const itemsSubtotal = inv.items.reduce((s, i) => s + i.totalRub, 0);
                    const discountAmount = Math.round(itemsSubtotal * inv.discountPercent / 100);
                    return (
                      <div className="flex justify-between text-sm text-slate-500">
                        <span className="italic">Скидка {inv.discountPercent}%</span>
                        <span>−{formatRub(discountAmount)}</span>
                      </div>
                    );
                  })()}
                  {inv.deliveryPriceRub > 0 && (
                    <div className="flex justify-between text-sm text-slate-500">
                      <span className="italic">Доставка</span>
                      <span>{formatRub(inv.deliveryPriceRub)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-1 mt-0.5">
                    <span className="flex items-baseline gap-2">
                      {inv.buyerLegalName && (
                        <span className="text-xs font-normal text-slate-500 italic">
                          {inv.buyerLegalName}
                        </span>
                      )}
                      Итого
                    </span>
                    <span>{formatRub(inv.totalRub)}</span>
                  </div>
                </div>

                {/* Type badge sidebar */}
                <div className="md:w-36 md:flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 px-3 py-2 flex flex-row flex-wrap md:flex-col gap-1">
                  <Badge {...TYPE_CONFIG[inv.invoiceType]} />
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-xs text-slate-900">Скачать счет:</span>
                    <div className="flex gap-2">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-500 hover:text-red-600 text-xs"
                        title="Скачать PDF"
                      >
                        PDF
                      </a>
                      <a
                        href={`/api/invoices/${inv.id}/xlsx`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 hover:text-green-700 text-xs"
                        title="Скачать Excel"
                      >
                        Excel
                      </a>
                    </div>
                  </div>
                  {inv.invoiceType === InvoiceTypeEnum.CASH && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-xs text-slate-900">Скачать накладную:</span>
                      <div className="flex gap-2">
                        <a
                          href={`/api/invoices/${inv.id}/tov-nakl/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-500 hover:text-red-600 text-xs"
                          title="Товарная накладная PDF (скачать)"
                        >
                          PDF
                        </a>
                        <a
                          href={`/api/invoices/${inv.id}/tov-nakl/xlsx`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-600 hover:text-green-700 text-xs"
                          title="Товарная накладная Excel"
                        >
                          Excel
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit form */}
              <CreateInvoiceForm
                partners={partners}
                orders={orders}
                products={products}
                sellerSettings={{
                  sellerLegalName: inv.sellerLegalName,
                  sellerInn: inv.sellerInn,
                  sellerKpp: inv.sellerKpp,
                  sellerAddress: inv.sellerAddress,
                  sellerPhone: inv.sellerPhone,
                  sellerBankName: inv.sellerBankName,
                  sellerShortBankName: inv.sellerShortBankName,
                  sellerBik: inv.sellerBik,
                  sellerBankAccNo: inv.sellerBankAccNo,
                  sellerAccNo: inv.sellerAccNo,
                }}
                usdRate={usdRate}
                rmbRate={rmbRate}
                isOpen={openInvoiceId === inv.id}
                onToggle={() => setOpenInvoiceId(openInvoiceId === inv.id ? null : inv.id)}
                initialInvoice={{
                  id: inv.id,
                  sequenceNumber: inv.sequenceNumber,
                  year: inv.year,
                  invoiceDate: inv.invoiceDate,
                  invoiceType: inv.invoiceType,
                  partnerId: inv.partnerId,
                  orderId: inv.orderId,
                  deliveryPriceRub: inv.deliveryPriceRub,
                  discountPercent: inv.discountPercent,
                  sellerLegalName: inv.sellerLegalName,
                  sellerInn: inv.sellerInn,
                  sellerKpp: inv.sellerKpp,
                  sellerAddress: inv.sellerAddress,
                  sellerPhone: inv.sellerPhone,
                  sellerBankName: inv.sellerBankName,
                  sellerShortBankName: inv.sellerShortBankName,
                  sellerBik: inv.sellerBik,
                  sellerBankAccNo: inv.sellerBankAccNo,
                  sellerAccNo: inv.sellerAccNo,
                  buyerLegalName: inv.buyerLegalName,
                  buyerInn: inv.buyerInn,
                  buyerKpp: inv.buyerKpp,
                  buyerAddress: inv.buyerAddress,
                  buyerPhone: inv.buyerPhone,
                  buyerBankName: inv.buyerBankName,
                  buyerBik: inv.buyerBik,
                  buyerBankAccNo: inv.buyerBankAccNo,
                  buyerAccNo: inv.buyerAccNo,
                  items: inv.items.map((item) => ({
                    productId: item.productId,
                    productVariantId: item.productVariantId,
                    quantity: item.quantity,
                    quantityM2: item.quantityM2,
                    priceUnit: item.priceUnit,
                    priceRub: item.priceRub,
                    totalRub: item.totalRub,
                  })),
                }}
              />
            </div>
          );
        })}
      </div>
      </>}

      <div ref={createFormRef} className="mt-8 border-t border-slate-200 pt-2">
        <CreateInvoiceForm
          key={initialOrder?.id ?? "new"}
          partners={partners}
          orders={orders}
          products={products}
          sellerSettings={sellerSettings}
          nextCashSeqNum={nextCashSeqNum}
          nextBankSeqNum={nextBankSeqNum}
          defaultInvoiceType={activeTab}
          usdRate={usdRate}
          rmbRate={rmbRate}
          initialOrder={initialOrder ?? undefined}
          onInvoiceTypeChange={(type) => {
            const params = new URLSearchParams();
            params.set("tab", type);
            const fromOrderId = searchParams.get("fromOrderId");
            if (fromOrderId) params.set("fromOrderId", fromOrderId);
            router.push(`/admin/invoices?${params.toString()}`, { scroll: false });
          }}
        />
      </div>
    </div>
  );
}
