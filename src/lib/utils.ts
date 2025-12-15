import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Currency } from '@/lib/definitions';
import { initialTransactions } from "./data";
import type { Transaction } from "./definitions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CONVERSION_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.09,
  XOF: 655.96,
};

// Converts an amount from one currency to another
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) {
    return amount;
  }
  // First, convert the amount to a base currency (EUR)
  const amountInEur = amount / CONVERSION_RATES[from];
  // Then, convert from the base currency to the target currency
  return amountInEur * CONVERSION_RATES[to];
}

// Formats a number into a currency string
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'fr-FR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// Formats a large number into a compact currency string (e.g., 10k, 1M)
export function formatCurrencyCompact(
  amount: number,
  currency: Currency,
  locale: string = 'fr-FR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  } catch (e) {
    // Fallback for very large numbers or errors
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M ${currency}`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(0)}K ${currency}`;
    return `${amount.toFixed(0)} ${currency}`;
  }
}

export const calculateBalance = (transactions: Transaction[]): { balance: number, totalBudget: number, totalExpenses: number } => {
  let totalBudget = 0;
  let totalExpenses = 0;

  transactions.forEach(tx => {
    const amountInEur = convertCurrency(tx.amount, tx.currency, 'EUR');
    if (tx.type === 'BUDGET_ADD') {
      totalBudget += amountInEur;
    } else {
      totalExpenses += amountInEur;
    }
  });

  return {
    balance: totalBudget - totalExpenses,
    totalBudget,
    totalExpenses
  };
};
