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

  function navigate(overrides: {
    partnerId?: string; productId?: string; status?: string;
    orderType?: string; dateFrom?: string; dateTo?: string;
  } = {}) {
    const v = { partnerId, productId, status, orderType, dateFrom, dateTo, ...overrides };
    const params = new URLSearchParams();
    if (v.partnerId) params.set("partnerId", v.partnerId);
    if (v.productId) params.set("productId", v.productId);
    params.set("status", v.status);
    if (v.orderType) params.set("orderType", v.orderType);
    if (v.dateFrom) params.set("dateFrom", v.dateFrom);
    if (v.dateTo) params.set("dateTo", v.dateTo);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-wrap gap-2 items-center">
      <PartnerCombobox
        partners={partners}
        value={partnerId}
        onChange={(id) => {
          setPartnerId(id);
          const newStatus = id && status === "DEFAULT" ? "ALL" : status;
          if (newStatus !== status) setStatus(newStatus);
          navigate({ partnerId: id, status: newStatus });
        }}
      />
      <ProductCombobox
        products={products}
        value={productId}
        onChange={(id) => {
          setProductId(id);
          const newStatus = id && status === "DEFAULT" ? "ALL" : status;
          if (newStatus !== status) setStatus(newStatus);
          navigate({ productId: id, status: newStatus });
        }}
      />
      <select
        name="status"
        value={status}
        onChange={(e) => { setStatus(e.target.value); navigate({ status: e.target.value }); }}
        className="admin-form-input text-sm w-44"
      >
        <option value="DEFAULT">2 мес. + незавершённые</option>
        <option value="ALL">Все заказы</option>
        {Object.values(OrderStatusEnum).filter((s) => s !== OrderStatusEnum.SELF_PICKUP).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <select
        name="orderType"
        value={orderType}
        onChange={(e) => {
          const newOrderType = e.target.value;
          const newStatus = newOrderType && status === "DEFAULT" ? "ALL" : status;
          setOrderType(newOrderType);
          if (newStatus !== status) setStatus(newStatus);
          navigate({ orderType: newOrderType, status: newStatus });
        }}
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
        onChange={(e) => setDateFrom(e.target.value)}
        onBlur={(e) => {
          const val = e.target.value;
          const newStatus = val && status === "DEFAULT" ? "ALL" : status;
          if (newStatus !== status) setStatus(newStatus);
          navigate({ dateFrom: val, status: newStatus });
        }}
        className="admin-form-input text-sm w-36"
      />
      <span className="text-slate-400 text-sm">—</span>
      <input
        name="dateTo"
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        onBlur={(e) => {
          const val = e.target.value;
          const newStatus = val && status === "DEFAULT" ? "ALL" : status;
          if (newStatus !== status) setStatus(newStatus);
          navigate({ dateTo: val, status: newStatus });
        }}
        className="admin-form-input text-sm w-36"
      />
      {(partnerId || productId || status !== "DEFAULT" || orderType || dateFrom || dateTo) && (
        <button
          type="button"
          onClick={() => {
            setPartnerId("");
            setProductId("");
            setStatus("DEFAULT");
            setOrderType("");
            setDateFrom("");
            setDateTo("");
            router.push("/admin");
          }}
          className="text-sm text-slate-600 hover:text-slate-900 font-medium"
        >
          Сбросить фильтры
        </button>
      )}
    </form>
  );
}
