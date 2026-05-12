import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import {
  OrderStatusEnum,
  OrderTypeEnum,
  ProductStatusEnum,
} from "@prisma/client";

import { Pagination } from "@/components/admin/Pagination";
import { OrdersGrid } from "@/components/admin/order/OrdersGrid";
import { CreateOrderForm } from "@/components/admin/order/CreateOrderForm";
import { OrdersFilterForm } from "@/components/admin/order/OrdersFilterForm";

const PAGE_SIZE = 100;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    partnerId?: string;
    productId?: string;
    status?: string;
    orderType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const partnerIdFilter = searchParams.partnerId ?? "";
  const productIdFilter = searchParams.productId ?? "";
  const statusFilter = searchParams.status ?? "DEFAULT";
  const orderTypeFilter = searchParams.orderType ?? "";
  const dateFrom = searchParams.dateFrom ?? "";
  const dateTo = searchParams.dateTo ?? "";

  // Start of previous month
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const partnerWhere = partnerIdFilter ? { partnerId: partnerIdFilter } : {};
  const productWhere = productIdFilter
    ? { items: { some: { productId: productIdFilter } } }
    : {};
  const orderTypeWhere = orderTypeFilter
    ? { orderType: orderTypeFilter as OrderTypeEnum }
    : {};
  const dateWhere =
    dateFrom || dateTo
      ? {
          orderDate: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999Z") }),
          },
        }
      : {};

  const where =
    statusFilter === "DEFAULT"
      ? {
          ...partnerWhere,
          ...productWhere,
          ...orderTypeWhere,
          ...dateWhere,
          NOT: { status: OrderStatusEnum.CANCELLED, paymentStatus: "NOT_PAID" as const },
          OR: [
            { orderDate: { gte: twoMonthsAgo } },
            {
              status: {
                in: [
                  OrderStatusEnum.RESERVE,
                  OrderStatusEnum.SHIPMENT_PLANNED,
                  OrderStatusEnum.SELF_PICKUP,
                ],
              },
            },
            { paymentStatus: "NOT_PAID" as const },
            { status: OrderStatusEnum.CANCELLED, paymentStatus: "PAID" as const },
          ],
        }
      : statusFilter === "ALL"
        ? { ...partnerWhere, ...productWhere, ...orderTypeWhere, ...dateWhere }
        : {
            ...partnerWhere,
            ...productWhere,
            ...orderTypeWhere,
            ...dateWhere,
            status: statusFilter as OrderStatusEnum,
          };

  const currentYear = now.getFullYear();

  const [
    orders,
    total,
    allPartners,
    deliveryMethods,
    paymentMethods,
    products,
    usdRateSetting,
    rmbRateSetting,
    maxSeqOrder,
  ] = await Promise.all([
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
        reserves: {
          select: {
            id: true,
            productVariantId: true,
            quantity: true,
            status: true,
            productVariant: { select: { variantName: true } },
          },
        },
        issues: {
          select: {
            id: true,
            quantity: true,
            issueDate: true,
            productVariant: { select: { variantName: true } },
          },
        },
      },
      orderBy: [{ year: "asc" }, { sequenceNumber: "asc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
    db.partner.findMany({
      include: {
        names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
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
          where: { status: "ACTIVE" },
          select: { id: true, variantName: true, isMain: true },
          orderBy: { variantName: "asc" },
        },
        prices: {
          select: {
            type: true,
            priceInCents: true,
            currency: true,
            unit: true,
          },
          where: { type: { in: ["DEALER", "RETAIL"] } },
        },
      },
      orderBy: { sku: "asc" },
    }),
    db.settings.findUnique({ where: { field: "usdMainRate" } }),
    db.settings.findUnique({ where: { field: "rmbOfficialRate" } }),
    db.order.aggregate({
      where: { year: currentYear },
      _max: { sequenceNumber: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const partnerOptions = allPartners.map((p) => ({
    id: p.id,
    names: p.names.map((n) => n.name),
  }));

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          <h1 className="admin-form-header mt-10">Заказы</h1>

          <OrdersFilterForm
            partners={partnerOptions}
            products={products}
            initialPartnerId={partnerIdFilter}
            initialProductId={productIdFilter}
            initialStatus={statusFilter}
            initialOrderType={orderTypeFilter}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
          />

          <OrdersGrid
            orders={orders}
            products={products}
            partners={partnerOptions}
            deliveryMethods={deliveryMethods}
            paymentMethods={paymentMethods}
            usdRate={usdRateSetting ? parseFloat(usdRateSetting.value) : null}
            rmbRate={rmbRateSetting ? parseFloat(rmbRateSetting.value) : null}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin"
            searchParams={searchParams}
          />

          {/* Create order form */}
          <div className="mt-20 mb-20">
            <CreateOrderForm
              partners={partnerOptions}
              deliveryMethods={deliveryMethods}
              paymentMethods={paymentMethods}
              products={products}
              usdRate={usdRateSetting ? parseFloat(usdRateSetting.value) : null}
              rmbRate={rmbRateSetting ? parseFloat(rmbRateSetting.value) : null}
              nextOrderNumber={(maxSeqOrder._max.sequenceNumber ?? 0) + 1}
            />
          </div>
        </div>
      </div>
    </>
  );
}
