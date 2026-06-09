import { OrderStatusEnum } from "@prisma/client";

// Maps Yandex order statuses to our internal OrderStatusEnum.
// All active statuses → SHIPMENT_PLANNED so the manager confirms delivery manually.
// PICKUP → SELF_PICKUP.
export const STATUS_MAP: Record<string, OrderStatusEnum> = {
  PROCESSING: OrderStatusEnum.SHIPMENT_PLANNED,
  PENDING: OrderStatusEnum.SHIPMENT_PLANNED,
  RESERVED: OrderStatusEnum.SHIPMENT_PLANNED,
  UNPAID: OrderStatusEnum.SHIPMENT_PLANNED,
  DELIVERY: OrderStatusEnum.SHIPMENT_PLANNED,
  DELIVERED: OrderStatusEnum.SHIPMENT_PLANNED,
  PICKUP: OrderStatusEnum.SHIPMENT_PLANNED,
  CANCELLED: OrderStatusEnum.CANCELLED,
  CANCELLED_IN_DELIVERY: OrderStatusEnum.CANCELLED,
  RETURNED: OrderStatusEnum.CANCELLED,
  RETURNED_PART: OrderStatusEnum.CANCELLED,
  LOST: OrderStatusEnum.CANCELLED,
};
