import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { OrderStatusEnum, OrderTypeEnum, ProductStatusEnum } from "@prisma/client";
import { Pagination } from "@/components/admin/Pagination";
import { OrdersGrid } from "@/components/admin/order/OrdersGrid";
import { CreateOrderForm } from "@/components/admin/order/CreateOrderForm";

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<OrderStatusEnum, string> = {
  ACTIVE: "Активен",
  FULFILLED: "Выполнен",
  CANCELLED: "Отменён",
};

const ORDER_TYPE_LABELS: Record<OrderTypeEnum, string> = {
  SALE: "Продажа",
  RETURN: "Возврат",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    orderType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const search = searchParams.search ?? "";
  const statusFilter = searchParams.status ?? "";
  const orderTypeFilter = searchParams.orderType ?? "";
  const dateFrom = searchParams.dateFrom ?? "";
  const dateTo = searchParams.dateTo ?? "";

  const where = {
    ...(search && {
      partner: {
        names: { some: { name: { contains: search, mode: "insensitive" as const } } },
      },
    }),
    ...(statusFilter && { status: statusFilter as OrderStatusEnum }),
    ...(orderTypeFilter && { orderType: orderTypeFilter as OrderTypeEnum }),
    ...((dateFrom || dateTo) && {
      orderDate: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999Z") }),
      },
    }),
  };

  const [orders, total, allPartners, deliveryMethods, paymentMethods, products] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        partner: {
          include: {
            names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
          },
        },
        deliveryMethod: true,
        items: {
          include: {
            product: { select: { sku: true } },
            productVariant: { select: { variantName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ year: "desc" }, { sequenceNumber: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
    db.partner.findMany({
      include: { names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.deliveryMethod.findMany({ orderBy: { name: "asc" } }),
    db.paymentMethod.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { status: ProductStatusEnum.ACTIVE },
      select: {
        id: true,
        sku: true,
        length_mm: true,
        width_mm: true,
        productVariants: {
          select: { id: true, variantName: true },
          orderBy: { variantName: "asc" },
        },
      },
      orderBy: { sku: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const partnerOptions = allPartners.map((p) => ({
    id: p.id,
    name: p.names[0]?.name ?? "—",
  }));

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          <h1 className="admin-form-header mt-10">Заказы</h1>

          {/* Create order form */}
          <CreateOrderForm
            partners={partnerOptions}
            deliveryMethods={deliveryMethods}
            paymentMethods={paymentMethods}
            products={products}
          />

          {/* Filters */}
          <form className="mt-6 flex flex-wrap gap-2 items-center">
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Партнёр"
              className="admin-form-input text-sm w-48"
            />
            <select name="status" defaultValue={statusFilter} className="admin-form-input text-sm w-36">
              <option value="">Все статусы</option>
              {Object.values(OrderStatusEnum).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select name="orderType" defaultValue={orderTypeFilter} className="admin-form-input text-sm w-32">
              <option value="">Все типы</option>
              {Object.values(OrderTypeEnum).map((t) => (
                <option key={t} value={t}>{ORDER_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="admin-form-input text-sm w-36"
            />
            <span className="text-slate-400 text-sm">—</span>
            <input
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="admin-form-input text-sm w-36"
            />
            <button type="submit" className="link-button link-button-gray text-sm">
              Найти
            </button>
          </form>

          <OrdersGrid orders={orders} products={products} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin"
            searchParams={searchParams}
          />
        </div>
      </div>
    </>
  );
}
