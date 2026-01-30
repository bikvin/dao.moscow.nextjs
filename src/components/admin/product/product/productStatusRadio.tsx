import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductStatusEnum } from "@prisma/client";

export function ProductStatusRadio({
  status,
  setStatus,
}: {
  status: ProductStatusEnum;
  setStatus: (status: ProductStatusEnum) => void;
}) {
  return (
    <RadioGroup
      value={status}
      onValueChange={(value) => setStatus(value as ProductStatusEnum)}
      className="flex flex-row gap-4 mb-4 text-lg"
    >
      <div className="flex items-center ">
        <RadioGroupItem value={ProductStatusEnum.ACTIVE} id="r1" />
        <Label htmlFor="r1" className="text-lg pl-2">
          Активен
        </Label>
      </div>
      <div className="flex items-center ">
        <RadioGroupItem value={ProductStatusEnum.CANCELLED} id="r2" />
        <Label htmlFor="r2" className="text-lg pl-2">
          Отменен
        </Label>
      </div>
    </RadioGroup>
  );
}
