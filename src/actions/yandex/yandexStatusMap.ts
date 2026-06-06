import { OrderStatusEnum } from "@prisma/client";

// Maps Yandex order statuses to our internal OrderStatusEnum.
// DELIVERED → SHIPPED.
// All in-progress statuses (PROCESSING, DELIVERY, etc.) → SHIPMENT_PLANNED with a planned date badge.
// PICKUP → SELF_PICKUP.
export const STATUS_MAP: Record<string, OrderStatusEnum> = {
  PROCESSING: OrderStatusEnum.SHIPMENT_PLANNED,
  PENDING: OrderStatusEnum.SHIPMENT_PLANNED,
  RESERVED: OrderStatusEnum.SHIPMENT_PLANNED,
  UNPAID: OrderStatusEnum.SHIPMENT_PLANNED,
  DELIVERY: OrderStatusEnum.SHIPMENT_PLANNED,
  PICKUP: OrderStatusEnum.SELF_PICKUP,
  DELIVERED: OrderStatusEnum.SHIPPED,
  CANCELLED: OrderStatusEnum.CANCELLED,
  CANCELLED_IN_DELIVERY: OrderStatusEnum.CANCELLED,
  RETURNED: OrderStatusEnum.CANCELLED,
  RETURNED_PART: OrderStatusEnum.CANCELLED,
  LOST: OrderStatusEnum.CANCELLED,
};
