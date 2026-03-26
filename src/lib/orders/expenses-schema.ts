import type { ExpenseType } from "./ledger";

export type LedgerExpense = {
  id: string;
  expenseDate: string;
  expenseType: ExpenseType;
  amountInr: number;
  vendorOrPayee: string | null;
  linkedOrderId: string | null;
  notes: string | null;
  createdAtIso: string;
  updatedAtIso: string;
};
