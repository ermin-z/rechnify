import { SwissQRBill } from "swissqrbill/svg";
import type { Data } from "swissqrbill/types";

export interface QrBillInput {
  iban: string;
  creditorName: string;
  creditorStreet: string;
  creditorZip: string;
  creditorCity: string;
  creditorCountry: string;
  amount: number;
  currency: "CHF" | "EUR";
  invoiceNumber: string;
  debtorName: string;
  debtorStreet: string;
  debtorZip: string;
  debtorCity: string;
  debtorCountry: string;
}

export function generateQrBill(input: QrBillInput): string {
  const data = qrBillData(input);

  const svg = new SwissQRBill(data, { language: "DE" });
  return svg.toString();
}

export function qrBillData(input: QrBillInput): Data {
  return {
    currency: input.currency,
    amount: input.amount,
    creditor: {
      account: input.iban,
      name: input.creditorName,
      address: input.creditorStreet,
      zip: input.creditorZip,
      city: input.creditorCity,
      country: input.creditorCountry,
    },
    debtor: {
      name: input.debtorName,
      address: input.debtorStreet,
      zip: input.debtorZip,
      city: input.debtorCity,
      country: input.debtorCountry,
    },
    reference: input.invoiceNumber,
  };
}
