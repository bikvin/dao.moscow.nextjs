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
import { Product } from "@prisma/client";

export function ProductSelect({
  products,
  id,
  setId,
}: {
  id: string;
  setId: (id: string) => void;
  products: Product[];
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
            ? products.find((product) => product.id === id)?.sku
            : "Выберите товар..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" p-0">
        <Command>
          <CommandInput
            placeholder="Выберите товар..."
            className="h-9 text-lg"
          />
          <CommandList>
            <CommandEmpty>Товар не найден.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  className="text-lg"
                  value={product.sku}
                  onSelect={() => {
                    setId(product.id);

                    setOpen(false);
                  }}
                >
                  {product.sku}
                  <Check
                    className={cn(
                      "ml-auto",
                      id === product.id ? "opacity-100" : "opacity-0"
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
