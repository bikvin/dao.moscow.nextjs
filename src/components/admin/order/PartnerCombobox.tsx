"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PartnerOption = { id: string; names: string[] };

export function PartnerCombobox({
  partners,
  value,
  onChange,
}: {
  partners: PartnerOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = partners.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-56 justify-between text-sm font-normal h-8 px-2"
        >
          <span className="truncate">
            {selected ? selected.names[0] : "— партнёр —"}
          </span>
          <ChevronsUpDown className="ml-1 w-3 h-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Поиск партнёра..." className="h-8 text-sm" />
          <CommandList>
            <CommandEmpty>Не найдено.</CommandEmpty>
            <CommandGroup>
              {partners.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.names.join(" ")}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <div className="flex flex-col">
                    <span>{p.names[0]}</span>
                    {p.names.length > 1 && (
                      <span className="text-xs text-slate-400">
                        {p.names.slice(1).join(" / ")}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto w-4 h-4 shrink-0",
                      value === p.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
