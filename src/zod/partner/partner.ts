import { z } from "zod";
import { AddressTypeEnum, PartnerStatusEnum } from "@prisma/client";

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  status: z.nativeEnum(PartnerStatusEnum),
  prospectNotes: z.string().optional(),
});

export const updatePartnerSchema = z.object({
  status: z.nativeEnum(PartnerStatusEnum),
  prospectNotes: z.string().optional(),
});

export const addNameSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  isPrimary: z.boolean().optional(),
});

export const addPhoneSchema = z.object({
  phone: z.string().min(1, "Укажите телефон"),
  notes: z.string().optional(),
});

export const addEmailSchema = z.object({
  email: z.string().email("Некорректный email"),
  notes: z.string().optional(),
});

export const addWebsiteSchema = z.object({
  url: z.string().min(1, "Укажите URL"),
});

export const addAddressSchema = z.object({
  type: z.nativeEnum(AddressTypeEnum),
  address: z.string().min(1, "Укажите адрес"),
});

export const addLegalEntitySchema = z.object({
  name: z.string().min(1, "Укажите название"),
  inn: z.string().optional(),
  kpp: z.string().optional(),
});

export const addContactPersonSchema = z.object({
  name: z.string().min(1, "Укажите имя"),
  role: z.string().optional(),
  notes: z.string().optional(),
});

export const addCitySchema = z.object({
  name: z.string().min(1, "Укажите город"),
});

export const addTransportCompanySchema = z.object({
  name: z.string().min(1, "Укажите название"),
});

export const sampleTypeSchema = z.object({
  name: z.string().min(1, "Укажите название"),
});
