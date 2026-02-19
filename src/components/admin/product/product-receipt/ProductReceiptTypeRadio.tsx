import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TypeRadioOption<T extends string> {
  value: T;
  label: string;
}

export function TypeRadio<T extends string>({
  type,
  setType,
  options,
}: {
  type: T;
  setType: (type: T) => void;
  options: TypeRadioOption<T>[];
}) {
  return (
    <RadioGroup
      value={type}
      onValueChange={(value) => setType(value as T)}
      className="flex flex-row gap-4 mb-4 text-lg"
    >
      {options.map((option, index) => (
        <div key={option.value} className="flex items-center ">
          <RadioGroupItem value={option.value} id={`r${index + 1}`} />
          <Label htmlFor={`r${index + 1}`} className="text-lg pl-2">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
