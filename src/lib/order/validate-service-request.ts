import type { MeasurementSelectionPayload } from "@/lib/measurements/format-whatsapp";
import { isPhonePlausible } from "@/lib/orders/phone";

import type { OrderItem, StitchingOrderItem } from "./types";

export type CustomerErrors = {
  name?: string;
  phone?: string;
  /** Saved-measurement step: must pick Use or Update for each garment returned */
  measurement?: string;
};

export type ItemErrors = {
  designReference?: string;
  deliveryDate?: string;
};

export type ServiceRequestValidationMessages = {
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  catalogRequired: string;
  uploadRequired: string;
  deliveryRequired: string;
  measurementChoiceRequired: string;
};

export function validateServiceRequestForm(
  customerName: string,
  customerPhone: string,
  items: OrderItem[],
  m: ServiceRequestValidationMessages,
  measurementPayload?: MeasurementSelectionPayload | null,
): { ok: boolean; customer: CustomerErrors; itemErrors: Record<string, ItemErrors> } {
  const customer: CustomerErrors = {};
  const trimmedName = customerName.trim();
  const trimmedPhone = customerPhone.trim();

  if (!trimmedName) {
    customer.name = m.nameRequired;
  }
  if (!trimmedPhone) {
    customer.phone = m.phoneRequired;
  } else if (!isPhonePlausible(customerPhone)) {
    customer.phone = m.phoneInvalid;
  }

  if (
    measurementPayload &&
    measurementPayload.items.length > 0 &&
    !measurementPayload.selectionComplete
  ) {
    customer.measurement = m.measurementChoiceRequired;
  }

  const itemErrors: Record<string, ItemErrors> = {};

  for (const item of items) {
    const row: ItemErrors = {};

    if (item.service === "stitching") {
      const s = item as StitchingOrderItem;
      if (s.designSource === "catalog" && !s.catalogId?.trim()) {
        row.designReference = m.catalogRequired;
      } else if (s.designSource === "upload" && !s.referenceFileName?.trim()) {
        row.designReference = m.uploadRequired;
      }
    }

    if (!item.deliveryPreference?.trim()) {
      row.deliveryDate = m.deliveryRequired;
    }

    if (Object.keys(row).length > 0) {
      itemErrors[item.id] = row;
    }
  }

  const ok = Object.keys(customer).length === 0 && Object.keys(itemErrors).length === 0;
  return { ok, customer, itemErrors };
}
