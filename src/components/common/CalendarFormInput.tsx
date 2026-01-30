import { Dispatch, SetStateAction, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ru } from "date-fns/locale";

export default function CalendarFormInput({
  label,
  date,
  setDate,
}: {
  label: string;
  date: Date | undefined;
  setDate: Dispatch<SetStateAction<Date | undefined>>;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected);
    setOpen(false);
  };

  return (
    <>
      <label htmlFor="name">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!date}
            className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
          >
            <CalendarIcon />
            {date ? (
              date.toLocaleDateString("ru-RU")
            ) : (
              <span>Выберите дату</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            locale={ru}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
