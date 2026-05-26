"use client";

import { useFormState } from "react-dom";
import { useState, useRef, useEffect } from "react";
import {
  createInvoice,
  type CreateInvoiceFormState,
} from "@/actions/invoice/createInvoice";
import { updateInvoice } from "@/actions/invoice/updateInvoice";
import { CollapsibleAddSection } from "@/components/admin/partner/CollapsibleAddSection";
import { PartnerCombobox } from "@/components/admin/order/PartnerCombobox";
import { ProductCombobox } from "@/components/admin/order/ProductCombobox";
import {
  type ProductOption,
  calcTotalFromPriceRub,
  calcPriceRubFromTotal,
} from "@/components/admin/order/AddOrderItemForm";
import FormButton from "@/components/common/formButton/formButton";
import {
  PriceUnitEnum,
  InvoiceTypeEnum,
  CurrencyEnum,
  PriceTypeEnum,
} from "@prisma/client";

type LegalEntity = {
  id: string;
  name: string;
  inn: string | null;
  kpp: string | null;
  bankName: string | null;
  bik: string | null;
  checkingAccount: string | null;
  correspondentAccount: string | null;
};

type PartnerOption = {
  id: string;
  names: string[];
  legalEntities: LegalEntity[];
};

type OrderOption = {
  id: string;
  year: number;
  sequenceNumber: number;
};

type SellerSettings = {
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
};

export type InitialInvoice = {
  id: string;
  sequenceNumber: number;
  year: number;
  invoiceDate: Date;
  invoiceType: InvoiceTypeEnum;
  partnerId: string;
  orderId: string | null;
  deliveryPriceRub: number;
  discountPercent: number;
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
  buyerLegalName: string;
  buyerInn: string;
  buyerKpp: string;
  buyerBankName: string;
  buyerBik: string;
  buyerBankAccNo: string;
  buyerAccNo: string;
  items: {
    productId: string;
    productVariantId: string;
    quantity: number;
    quantityM2: number | null;
    priceUnit: PriceUnitEnum;
    priceRub: number;
    totalRub: number;
  }[];
};

type ItemState = {
  productId: string;
  variantId: string;
  quantity: string;
  priceUnit: PriceUnitEnum;
  priceForUnit: PriceUnitEnum;
  price: string;
  currency: CurrencyEnum;
  priceRub: string;
  total: string;
};

const EMPTY_ITEM: ItemState = {
  productId: "",
  variantId: "",
  quantity: "1",
  priceUnit: PriceUnitEnum.ITEM,
  priceForUnit: PriceUnitEnum.M2,
  price: "",
  currency: CurrencyEnum.RUB,
  priceRub: "",
  total: "",
};

const PRICE_UNIT_LABELS: Record<PriceUnitEnum, string> = {
  M2: "м²",
  ITEM: "шт",
};

const CURRENCY_LABELS: Record<CurrencyEnum, string> = {
  RUB: "₽",
  USD: "$",
  RMB: "¥",
};

function computeM2(
  product: ProductOption | undefined,
  qty: string,
): number | null {
  if (!product || !qty) return null;
  const q = parseInt(qty) || 0;
  if (q <= 0) return null;
  return (product.length_mm * product.width_mm * q) / 1_000_000;
}

function ItemRow({
  item,
  index,
  products,
  onChange,
  onRemove,
  usdRate,
  rmbRate,
}: {
  item: ItemState;
  index: number;
  products: ProductOption[];
  onChange: (index: number, next: ItemState) => void;
  onRemove: (index: number) => void;
  usdRate: number | null;
  rmbRate: number | null;
}) {
  const lastEdited = useRef<"price" | "total">("price");
  const product = products.find((p) => p.id === item.productId);

  const handleProductChange = (id: string) => {
    const p = products.find((x) => x.id === id);
    const variantId =
      p?.productVariants.find((v) => v.isMain)?.id ??
      p?.productVariants[0]?.id ??
      "";
    onChange(index, {
      ...item,
      productId: id,
      variantId,
      price: "",
      priceRub: "",
      total: "",
    });
  };

  const handleQtyChange = (qty: string) => {
    if (lastEdited.current === "price") {
      onChange(index, {
        ...item,
        quantity: qty,
        total: calcTotalFromPriceRub(
          item.priceRub,
          qty,
          item.priceForUnit,
          product,
        ),
      });
    } else {
      const priceRub = calcPriceRubFromTotal(
        item.total,
        qty,
        item.priceForUnit,
        product,
      );
      onChange(index, {
        ...item,
        quantity: qty,
        priceRub,
        price: item.currency === CurrencyEnum.RUB ? priceRub : item.price,
      });
    }
  };

  const handlePriceForUnitChange = (unit: PriceUnitEnum) => {
    if (lastEdited.current === "price") {
      onChange(index, {
        ...item,
        priceForUnit: unit,
        total: calcTotalFromPriceRub(
          item.priceRub,
          item.quantity,
          unit,
          product,
        ),
      });
    } else {
      const priceRub = calcPriceRubFromTotal(
        item.total,
        item.quantity,
        unit,
        product,
      );
      onChange(index, {
        ...item,
        priceForUnit: unit,
        priceRub,
        price: item.currency === CurrencyEnum.RUB ? priceRub : item.price,
      });
    }
  };

  function calcPriceRub(price: string, currency: CurrencyEnum): string {
    const num = parseFloat(price);
    if (currency === CurrencyEnum.RUB) return price;
    if (currency === CurrencyEnum.USD && usdRate != null && !isNaN(num))
      return (num * usdRate).toFixed(2);
    if (currency === CurrencyEnum.RMB && rmbRate != null && !isNaN(num))
      return (num * rmbRate).toFixed(2);
    return item.priceRub;
  }

  const handlePriceChange = (price: string) => {
    lastEdited.current = "price";
    const priceRub = calcPriceRub(price, item.currency);
    const total = calcTotalFromPriceRub(
      priceRub,
      item.quantity,
      item.priceForUnit,
      product,
    );
    onChange(index, { ...item, price, priceRub, total });
  };

  const handlePriceRubChange = (priceRub: string) => {
    lastEdited.current = "price";
    const total = calcTotalFromPriceRub(
      priceRub,
      item.quantity,
      item.priceForUnit,
      product,
    );
    onChange(index, { ...item, priceRub, total });
  };

  const handleCurrencyChange = (currency: CurrencyEnum) => {
    lastEdited.current = "price";
    const priceRub = calcPriceRub(item.price, currency);
    const total =
      currency === CurrencyEnum.RUB || priceRub !== ""
        ? calcTotalFromPriceRub(
            priceRub,
            item.quantity,
            item.priceForUnit,
            product,
          )
        : "";
    onChange(index, { ...item, currency, priceRub, total });
  };

  const handleTotalChange = (total: string) => {
    lastEdited.current = "total";
    const priceRub = calcPriceRubFromTotal(
      total,
      item.quantity,
      item.priceForUnit,
      product,
    );
    onChange(index, {
      ...item,
      total,
      priceRub,
      price: priceRub,
      currency: CurrencyEnum.RUB,
    });
  };

  const m2 = computeM2(product, item.quantity);

  return (
    <div className="flex flex-wrap items-start gap-2 pb-3 border-b border-slate-200 last:border-0">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Товар</label>
        <input type="hidden" name="productId" value={item.productId} />
        <ProductCombobox
          products={products}
          value={item.productId}
          onChange={handleProductChange}
        />
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Вариант</label>
        <select
          name="productVariantId"
          value={item.variantId}
          onChange={(e) =>
            onChange(index, { ...item, variantId: e.target.value })
          }
          className="admin-form-input text-sm w-36"
        >
          <option value="">— вариант —</option>
          {product?.productVariants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.variantName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Кол-во</label>
        <input
          name="quantity"
          type="number"
          min="1"
          placeholder="0"
          value={item.quantity}
          onChange={(e) => handleQtyChange(e.target.value)}
          className="admin-form-input text-sm w-20"
        />
      </div>

      {m2 !== null && (
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-400">М²</label>
          <div className="text-sm py-1 px-2 bg-slate-100 rounded w-20 text-right border border-slate-200">
            {m2.toFixed(2)}
          </div>
        </div>
      )}
      <input
        type="hidden"
        name="quantityM2"
        value={
          m2 !== null && item.priceForUnit === PriceUnitEnum.M2
            ? m2.toFixed(6)
            : ""
        }
      />

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Цена</label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          value={item.price}
          onChange={(e) => handlePriceChange(e.target.value)}
          className="admin-form-input text-sm w-28"
        />
        {product && product.prices.length > 0 && (
          <div className="flex gap-2 mt-0.5">
            {[PriceTypeEnum.DEALER, PriceTypeEnum.RETAIL].map((type) => {
              const p = product.prices.find((pr) => pr.type === type);
              if (!p) return null;
              const val = (p.priceInCents / 100).toString();
              const label =
                type === PriceTypeEnum.DEALER ? "Дилерская" : "Розничная";
              return (
                <button
                  key={type}
                  type="button"
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => {
                    lastEdited.current = "price";
                    const priceNum = parseFloat(val);
                    let priceRub = "";
                    if (p.currency === CurrencyEnum.RUB) {
                      priceRub = val;
                    } else if (
                      p.currency === CurrencyEnum.USD &&
                      usdRate != null
                    ) {
                      priceRub = (priceNum * usdRate).toFixed(2);
                    } else if (
                      p.currency === CurrencyEnum.RMB &&
                      rmbRate != null
                    ) {
                      priceRub = (priceNum * rmbRate).toFixed(2);
                    }
                    const total = calcTotalFromPriceRub(
                      priceRub,
                      item.quantity,
                      p.unit,
                      product,
                    );
                    onChange(index, {
                      ...item,
                      price: val,
                      currency: p.currency,
                      priceRub,
                      priceForUnit: p.unit,
                      total,
                    });
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Валюта</label>
        <select
          value={item.currency}
          onChange={(e) => handleCurrencyChange(e.target.value as CurrencyEnum)}
          className="admin-form-input text-sm w-20"
        >
          {Object.values(CurrencyEnum).map((c) => (
            <option key={c} value={c}>
              {CURRENCY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {item.currency !== CurrencyEnum.RUB && (
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-400">Цена ₽</label>
          <input
            name="priceRub"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            value={item.priceRub}
            onChange={(e) => handlePriceRubChange(e.target.value)}
            className="admin-form-input text-sm w-28"
          />
        </div>
      )}
      {item.currency === CurrencyEnum.RUB && (
        <input type="hidden" name="priceRub" value={item.priceRub} />
      )}

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Цена за</label>
        <input type="hidden" name="priceUnit" value={item.priceForUnit} />
        <select
          value={item.priceForUnit}
          onChange={(e) =>
            handlePriceForUnitChange(e.target.value as PriceUnitEnum)
          }
          className="admin-form-input text-sm w-20"
        >
          {Object.values(PriceUnitEnum).map((u) => (
            <option key={u} value={u}>
              {PRICE_UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Итого ₽</label>
        <input
          name="itemTotal"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          value={item.total}
          onChange={(e) => handleTotalChange(e.target.value)}
          className="admin-form-input text-sm w-28"
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-slate-400 hover:text-red-500 text-sm px-1 pb-1"
      >
        ✕
      </button>
    </div>
  );
}

export function CreateInvoiceForm({
  partners,
  orders,
  products,
  sellerSettings,
  nextCashSeqNum,
  nextBankSeqNum,
  defaultInvoiceType,
  usdRate,
  rmbRate,
  initialInvoice,
  isOpen,
  onToggle,
}: {
  partners: PartnerOption[];
  orders: OrderOption[];
  products: ProductOption[];
  sellerSettings: SellerSettings;
  nextCashSeqNum?: number;
  nextBankSeqNum?: number;
  defaultInvoiceType?: InvoiceTypeEnum;
  usdRate: number | null;
  rmbRate: number | null;
  initialInvoice?: InitialInvoice;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const isEditMode = !!initialInvoice;
  const boundAction = isEditMode
    ? updateInvoice.bind(null, initialInvoice.id)
    : createInvoice;
  const [formState, action] = useFormState<CreateInvoiceFormState, FormData>(
    boundAction,
    {},
  );

  const EMPTY_BUYER = {
    buyerLegalName: "",
    buyerInn: "",
    buyerKpp: "",
    buyerBankName: "",
    buyerBik: "",
    buyerBankAccNo: "",
    buyerAccNo: "",
  };

  function itemsFromInitial(inv: InitialInvoice): ItemState[] {
    return inv.items.map((item) => {
      const priceRubStr = (item.priceRub / 100).toFixed(2);
      const totalStr = (item.totalRub / 100).toFixed(2);
      return {
        productId: item.productId,
        variantId: item.productVariantId,
        quantity: item.quantity.toString(),
        priceUnit: PriceUnitEnum.ITEM,
        priceForUnit: item.priceUnit,
        price: priceRubStr,
        currency: CurrencyEnum.RUB,
        priceRub: priceRubStr,
        total: totalStr,
      };
    });
  }

  const [formKey, setFormKey] = useState(0);
  const [partnerId, setPartnerId] = useState(initialInvoice?.partnerId ?? "");
  const [invoiceType, setInvoiceType] = useState<InvoiceTypeEnum>(
    initialInvoice?.invoiceType ?? defaultInvoiceType ?? InvoiceTypeEnum.CASH,
  );
  const [items, setItems] = useState<ItemState[]>(
    initialInvoice ? itemsFromInitial(initialInvoice) : [{ ...EMPTY_ITEM }],
  );
  const [showSeller, setShowSeller] = useState(false);

  const [buyer, setBuyer] = useState(
    initialInvoice
      ? {
          buyerLegalName: initialInvoice.buyerLegalName,
          buyerInn: initialInvoice.buyerInn,
          buyerKpp: initialInvoice.buyerKpp,
          buyerBankName: initialInvoice.buyerBankName,
          buyerBik: initialInvoice.buyerBik,
          buyerBankAccNo: initialInvoice.buyerBankAccNo,
          buyerAccNo: initialInvoice.buyerAccNo,
        }
      : EMPTY_BUYER,
  );

  useEffect(() => {
    if (formState.success) {
      if (isEditMode) {
        onToggle?.();
      } else {
        setFormKey((k) => k + 1);
        setPartnerId("");
        setInvoiceType(InvoiceTypeEnum.CASH);
        setItems([{ ...EMPTY_ITEM }]);
        setShowSeller(false);
        setBuyer(EMPTY_BUYER);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.success]);

  const partner = partners.find((p) => p.id === partnerId);
  const isBank = invoiceType === InvoiceTypeEnum.BANK;

  const handlePartnerChange = (id: string) => {
    setPartnerId(id);
    setBuyer(EMPTY_BUYER);
  };

  const handleLegalEntityChange = (id: string) => {
    const le = partner?.legalEntities.find((e) => e.id === id);
    if (le) {
      setBuyer({
        buyerLegalName: le.name ?? "",
        buyerInn: le.inn ?? "",
        buyerKpp: le.kpp ?? "",
        buyerBankName: le.bankName ?? "",
        buyerBik: le.bik ?? "",
        buyerBankAccNo: le.correspondentAccount ?? "",
        buyerAccNo: le.checkingAccount ?? "",
      });
    }
  };

  const handleItemChange = (index: number, next: ItemState) => {
    setItems((prev) => prev.map((item, i) => (i === index ? next : item)));
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  // Compute display total
  const itemsSubtotal = items.reduce(
    (acc, item) => acc + (parseFloat(item.total) || 0),
    0,
  );

  const formContent = (
    <form key={formKey} action={action}>
      {/* Header fields */}
      <div className="flex flex-wrap gap-4 mb-6">
        {isEditMode ? (
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-500">Номер счёта</label>
            <div className="flex items-center gap-1 text-sm font-semibold">
              {initialInvoice.sequenceNumber}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-500">Номер счёта</label>
            <div className="flex items-center gap-1 text-sm">
              <input
                key={invoiceType}
                name="invoiceNumber"
                type="number"
                min="1"
                defaultValue={invoiceType === InvoiceTypeEnum.CASH ? (nextCashSeqNum ?? 1) : (nextBankSeqNum ?? 1)}
                className="admin-form-input h-8 text-sm w-20 text-right"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500">Дата</label>
          <input
            name="invoiceDate"
            type="date"
            defaultValue={
              initialInvoice
                ? new Date(initialInvoice.invoiceDate)
                    .toISOString()
                    .slice(0, 10)
                : new Date().toISOString().slice(0, 10)
            }
            className="admin-form-input h-8 text-sm"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500">Тип</label>
          <select
            name="invoiceType"
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value as InvoiceTypeEnum)}
            disabled={isEditMode}
            className="admin-form-input h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={InvoiceTypeEnum.CASH}>Наличные</option>
            <option value={InvoiceTypeEnum.BANK}>Безналичные</option>
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500">Партнёр</label>
          <div>
            <input type="hidden" name="partnerId" value={partnerId} />
            <PartnerCombobox
              partners={partners}
              value={partnerId}
              onChange={handlePartnerChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500">
            Заказ (необязательно)
          </label>
          <select
            name="orderId"
            defaultValue={initialInvoice?.orderId ?? ""}
            className="admin-form-input h-8 text-sm w-40"
          >
            <option value="">— без заказа —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                №{o.sequenceNumber}/{o.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6 flex flex-col gap-3">
        {items.map((item, i) => (
          <ItemRow
            key={i}
            item={item}
            index={i}
            products={products}
            onChange={handleItemChange}
            onRemove={handleRemoveItem}
            usdRate={usdRate}
            rmbRate={rmbRate}
          />
        ))}
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 text-sm text-slate-500 hover:text-slate-800 underline"
        >
          + добавить позицию
        </button>
      </div>

      {/* Totals */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500">Скидка %</label>
          <input
            name="discountPercent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={initialInvoice?.discountPercent ?? 0}
            className="admin-form-input h-8 text-sm w-20 text-right"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500">Доставка ₽</label>
          <input
            name="deliveryPriceRub"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              initialInvoice ? initialInvoice.deliveryPriceRub / 100 : 0
            }
            className="admin-form-input h-8 text-sm w-28 text-right"
          />
        </div>
        {itemsSubtotal > 0 && (
          <div className="flex flex-col gap-0.5 justify-end">
            <span className="text-xs text-slate-500">Подитог</span>
            <span className="text-sm font-medium">
              {itemsSubtotal.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
              })}{" "}
              ₽
            </span>
          </div>
        )}
      </div>

      {/* Buyer fields (BANK only) */}
      {isBank && (
        <div className="mb-6 p-4 border border-slate-200 rounded">
          <h3 className="text-sm font-semibold mb-3">Покупатель</h3>
          {partner && partner.legalEntities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {partner.legalEntities.map((le) => (
                <button
                  key={le.id}
                  type="button"
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => handleLegalEntityChange(le.id)}
                >
                  {le.name}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["buyerLegalName", "Наименование"],
                ["buyerInn", "ИНН"],
                ["buyerKpp", "КПП"],
                ["buyerBankName", "Банк"],
                ["buyerBik", "БИК"],
                ["buyerBankAccNo", "Корр. счёт"],
                ["buyerAccNo", "Расч. счёт"],
              ] as [keyof typeof buyer, string][]
            ).map(([field, label]) => (
              <div key={field} className="flex flex-col gap-0.5">
                <label className="text-xs text-slate-500">{label}</label>
                <input
                  name={field}
                  type="text"
                  value={buyer[field]}
                  onChange={(e) =>
                    setBuyer((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className="admin-form-input h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden buyer fields when CASH (submit empty strings) */}
      {!isBank && (
        <>
          <input type="hidden" name="buyerLegalName" value="" />
          <input type="hidden" name="buyerInn" value="" />
          <input type="hidden" name="buyerKpp" value="" />
          <input type="hidden" name="buyerBankName" value="" />
          <input type="hidden" name="buyerBik" value="" />
          <input type="hidden" name="buyerBankAccNo" value="" />
          <input type="hidden" name="buyerAccNo" value="" />
        </>
      )}

      {/* Seller fields (collapsible) */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowSeller((v) => !v)}
          className="text-sm text-slate-500 hover:text-slate-800 underline mb-2"
        >
          {showSeller ? "Скрыть реквизиты продавца" : "Реквизиты продавца"}
        </button>
        {showSeller && (
          <div className="p-4 border border-slate-200 rounded grid grid-cols-2 gap-3">
            {(
              [
                ["sellerLegalName", "Полное наименование"],
                ["sellerInn", "ИНН"],
                ["sellerKpp", "КПП"],
                ["sellerAddress", "Юридический адрес"],
                ["sellerPhone", "Телефон"],
                ["sellerBankName", "Банк"],
                ["sellerShortBankName", "Краткое название банка"],
                ["sellerBik", "БИК"],
                ["sellerBankAccNo", "Корр. счёт"],
                ["sellerAccNo", "Расч. счёт"],
              ] as [keyof SellerSettings, string][]
            ).map(([field, label]) => (
              <div key={field} className="flex flex-col gap-0.5">
                <label className="text-xs text-slate-500">{label}</label>
                <input
                  name={field}
                  type="text"
                  defaultValue={sellerSettings[field]}
                  className="admin-form-input h-8 text-sm"
                />
              </div>
            ))}
          </div>
        )}
        {/* Hidden seller fields when collapsed (use defaults from settings) */}
        {!showSeller && (
          <>
            <input
              type="hidden"
              name="sellerLegalName"
              value={sellerSettings.sellerLegalName}
            />
            <input
              type="hidden"
              name="sellerInn"
              value={sellerSettings.sellerInn}
            />
            <input
              type="hidden"
              name="sellerKpp"
              value={sellerSettings.sellerKpp}
            />
            <input
              type="hidden"
              name="sellerAddress"
              value={sellerSettings.sellerAddress}
            />
            <input
              type="hidden"
              name="sellerPhone"
              value={sellerSettings.sellerPhone}
            />
            <input
              type="hidden"
              name="sellerBankName"
              value={sellerSettings.sellerBankName}
            />
            <input
              type="hidden"
              name="sellerShortBankName"
              value={sellerSettings.sellerShortBankName}
            />
            <input
              type="hidden"
              name="sellerBik"
              value={sellerSettings.sellerBik}
            />
            <input
              type="hidden"
              name="sellerBankAccNo"
              value={sellerSettings.sellerBankAccNo}
            />
            <input
              type="hidden"
              name="sellerAccNo"
              value={sellerSettings.sellerAccNo}
            />
          </>
        )}
      </div>

      <FormButton>
        {isEditMode ? "Сохранить изменения" : "Создать счёт"}
      </FormButton>

      {formState.errors?._form && (
        <p className="text-red-600 text-sm mt-2">
          {formState.errors._form.join(", ")}
        </p>
      )}
      {formState.success && !isEditMode && (
        <p className="text-green-600 text-sm mt-2">
          {formState.success.message}
        </p>
      )}
    </form>
  );

  if (isEditMode) {
    return (
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pt-14 pb-2 bg-white border-t border-slate-200">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <CollapsibleAddSection
      label="Создать новый счёт"
      success={!!formState.success}
      showLabel
    >
      {formContent}
    </CollapsibleAddSection>
  );
}
