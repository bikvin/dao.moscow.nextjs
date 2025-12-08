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
import { ProductGroup } from "@prisma/client";

export function ProductGroupSelect({
  productGroups,
  id,
  setId,
}: {
  id: string;
  setId: (id: string) => void;
  productGroups: ProductGroup[];
}) {
  const [open, setOpen] = React.useState(false);
  // const [id, setId] = React.useState(selectedProductGroupId || "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100%] md:w-[50%] justify-between mb-4 text-lg"
        >
          {id
            ? productGroups.find((group) => group.id === id)?.name
            : "Выберите группу..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" p-0">
        <Command>
          <CommandInput
            placeholder="Выберите группу..."
            className="h-9 text-lg"
          />
          <CommandList>
            <CommandEmpty>Группа не найдена.</CommandEmpty>
            <CommandGroup>
              {productGroups.map((group) => (
                <CommandItem
                  key={group.id}
                  className="text-lg"
                  value={group.name}
                  onSelect={() => {
                    setId(group.id);

                    setOpen(false);
                  }}
                >
                  {group.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      id === group.id ? "opacity-100" : "opacity-0"
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
