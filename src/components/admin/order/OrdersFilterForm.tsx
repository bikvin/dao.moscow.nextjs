"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatusEnum, OrderTypeEnum } from "@prisma/client";
import { PartnerCombobox } from "./PartnerCombobox";
import { ProductCombobox } from "./ProductCombobox";
import { type ProductOption } from "./AddOrderItemForm";

type PartnerOption = { id: string; names: string[] };

const STATUS_LABELS: Record<OrderStatusEnum, string> = {
  RESERVE: "Резерв",
  SHIPMENT_PLANNED: "Отгрузка запланирована",
  SHIPPED: "Отгружен",
  SELF_PICKUP: "Самовывоз",
  CANCELLED: "Отменён",
};

const ORDER_TYPE_LABELS: Record<OrderTypeEnum, string> = {
  SALE: "Продажа",
  RETURN: "Возврат",
};

export function OrdersFilterForm({
  partners,
  products,
  initialPartnerId,
  initialProductId,
  initialStatus,
  initialOrderType,
  initialDateFrom,
  initialDateTo,
}: {
  partners: PartnerOption[];
  products: ProductOption[];
  initialPartnerId: string;
  initialProductId: string;
  initialStatus: string;
  initialOrderType: string;
  initialDateFrom: string;
  initialDateTo: string;
}) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState(initialPartnerId);
  const [productId, setProductId] = useState(initialProductId);
  const [status, setStatus] = useState(initialStatus);
  const [orderType, setOrderType] = useState(initialOrderType);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  function autoSwitchStatus() {
    if (status === "DEFAULT") setStatus("ALL");
  }

  function submit() {
    const params = new URLSearchParams();
    if (partnerId) params.set("partnerId", partnerId);
    if (productId) params.set("productId", productId);
    params.set("status", status);
    if (orderType) params.set("orderType", orderType);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-6 flex flex-wrap gap-2 items-center">
      <PartnerCombobox
        partners={partners}
        value={partnerId}
        onChange={(id) => {
          setPartnerId(id);
          if (id && status === "DEFAULT") setStatus("ALL");
        }}
      />
      <ProductCombobox
        products={products}
        value={productId}
        onChange={(id) => {
          setProductId(id);
          if (id && status === "DEFAULT") setStatus("ALL");
        }}
      />
      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="admin-form-input text-sm w-44"
      >
        <option value="DEFAULT">Актуальные</option>
        <option value="ALL">Все заказы</option>
        {Object.values(OrderStatusEnum).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <select
        name="orderType"
        value={orderType}
        onChange={(e) => { setOrderType(e.target.value); autoSwitchStatus(); }}
        className="admin-form-input text-sm w-32"
      >
        <option value="">Все типы</option>
        {Object.values(OrderTypeEnum).map((t) => (
          <option key={t} value={t}>{ORDER_TYPE_LABELS[t]}</option>
        ))}
      </select>
      <input
        name="dateFrom"
        type="date"
        value={dateFrom}
        onChange={(e) => { setDateFrom(e.target.value); if (e.target.value) autoSwitchStatus(); }}
        className="admin-form-input text-sm w-36"
      />
      <span className="text-slate-400 text-sm">—</span>
      <input
        name="dateTo"
        type="date"
        value={dateTo}
        onChange={(e) => { setDateTo(e.target.value); if (e.target.value) autoSwitchStatus(); }}
        className="admin-form-input text-sm w-36"
      />
      <button type="submit" className="link-button link-button-gray text-sm">
        Найти
      </button>
      {(partnerId || productId) && (
        <button
          type="button"
          onClick={() => { setPartnerId(""); setProductId(""); submit(); }}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          Сбросить
        </button>
      )}
    </form>
  );
}
