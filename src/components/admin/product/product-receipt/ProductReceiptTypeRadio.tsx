import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductReceiptTypeEnum } from "@prisma/client";

export function ProductReceiptTypeRadio({
  type,
  setType,
}: {
  type: ProductReceiptTypeEnum;
  setType: (type: ProductReceiptTypeEnum) => void;
}) {
  return (
    <RadioGroup
      value={type}
      onValueChange={(value) => setType(value as ProductReceiptTypeEnum)}
      className="flex flex-row gap-4 mb-4 text-lg"
    >
      <div className="flex items-center ">
        <RadioGroupItem value={ProductReceiptTypeEnum.SHIPMENT} id="r1" />
        <Label htmlFor="r1" className="text-lg pl-2">
          Поставка
        </Label>
      </div>
      <div className="flex items-center ">
        <RadioGroupItem value={ProductReceiptTypeEnum.CORRECTION} id="r2" />
        <Label htmlFor="r2" className="text-lg pl-2">
          Коррекция остатка
        </Label>
      </div>
    </RadioGroup>
  );
}
