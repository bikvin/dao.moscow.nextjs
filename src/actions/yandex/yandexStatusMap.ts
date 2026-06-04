import { OrderStatusEnum } from "@prisma/client";

// Maps Yandex order statuses to our internal OrderStatusEnum.
// DELIVERED → SHIPPED (manager manually confirms physical shipment later).
// All in-progress statuses → RESERVE (creates a stock reserve on import).
export const STATUS_MAP: Record<string, OrderStatusEnum> = {
  PROCESSING: OrderStatusEnum.RESERVE,
  PENDING: OrderStatusEnum.RESERVE,
  RESERVED: OrderStatusEnum.RESERVE,
  UNPAID: OrderStatusEnum.RESERVE,
  DELIVERY: OrderStatusEnum.SHIPMENT_PLANNED,
  PICKUP: OrderStatusEnum.SELF_PICKUP,
  DELIVERED: OrderStatusEnum.SHIPPED,
  CANCELLED: OrderStatusEnum.CANCELLED,
  CANCELLED_IN_DELIVERY: OrderStatusEnum.CANCELLED,
  RETURNED: OrderStatusEnum.CANCELLED,
  RETURNED_PART: OrderStatusEnum.CANCELLED,
  LOST: OrderStatusEnum.CANCELLED,
};
