"use client";

import { ProductVariant } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductVariantSelectProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
  disabled?: boolean;
}

export function ProductVariantSelect({
  variants,
  selectedVariantId,
  onVariantChange,
  disabled = false,
}: ProductVariantSelectProps) {
  return (
    <Select
      value={selectedVariantId}
      onValueChange={onVariantChange}
      disabled={disabled || variants.length === 0}
    >
      <SelectTrigger className="w-[100%] md:w-[50%] text-lg">
        <SelectValue placeholder="Выберите вариант..." />
      </SelectTrigger>
      <SelectContent>
        {variants.map((variant) => (
          <SelectItem key={variant.id} value={variant.id} className="text-lg">
            {variant.variantName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
