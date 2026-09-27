import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import {
  invoiceApi,
  type InvoicePaymentsParams,
  type InvoiceProductsParams,
} from '~/api/invoice.api';
import type { AddInvoicePaymentPayload, InvoiceListParams } from '~/types/invoice';
import { downloadBase64Pdf } from '~/utils/pdf-downloader';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params: Record<string, unknown>) => [...invoiceKeys.all, 'list', params] as const,
  details: (id?: string) => ['invoice-detail', id] as const,
  paymentSummary: (id?: string) => ['invoice-payment-summary', id] as const,
  payments: (id?: string, params?: Record<string, unknown>) =>
    ['invoice-payments', id, params] as const,
  products: (id?: string, params?: Record<string, unknown>) =>
    ['invoice-products', id, params] as const,
};

const parseIsOverDueFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

interface UseInvoicesListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  date?: DateRange;
  isOverDueFilter: string;
  companyNameFilter: string;
  companyNipFilter: string;
  amountFrom: string;
  amountTo: string;
}

export function useInvoicesList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  date,
  isOverDueFilter,
  companyNameFilter,
  companyNipFilter,
  amountFrom,
  amountTo,
}: UseInvoicesListProps) {
  const issueDateFrom = date?.from
    ? new Date(
        Date.UTC(date.from.getFullYear(), date.from.getMonth(), date.from.getDate(), 0, 0, 0),
      ).toISOString()
    : undefined;

  const issueDateTo = date?.to
    ? new Date(
        Date.UTC(date.to.getFullYear(), date.to.getMonth(), date.to.getDate(), 23, 59, 59, 999),
      ).toISOString()
    : undefined;

  const isOverDue = parseIsOverDueFilter(isOverDueFilter);
  const totalAmountFrom = amountFrom ? Number(amountFrom) * 10000 : undefined;
  const totalAmountTo = amountTo ? Number(amountTo) * 10000 : undefined;

  const queryParams: InvoiceListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    companyName: companyNameFilter,
    companyNip: companyNipFilter,
    issueDateFrom,
    issueDateTo,
    isOverDue,
    totalAmountFrom,
    totalAmountTo,
  };

  return useQuery({
    queryKey: invoiceKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => invoiceApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceDetails(invoiceId?: string) {
  return useQuery({
    queryKey: invoiceKeys.details(invoiceId),
    queryFn: () => invoiceApi.getDetails(invoiceId || ''),
    retry: false,
    enabled: Boolean(invoiceId),
  });
}

export function useInvoicePaymentSummary(invoiceId?: string) {
  return useQuery({
    queryKey: invoiceKeys.paymentSummary(invoiceId),
    queryFn: () => invoiceApi.getPaymentSummary(invoiceId || ''),
    enabled: Boolean(invoiceId),
  });
}

export function useAddInvoicePaymentMutation(
  invoiceId: string,
  options?: { onSuccess?: () => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddInvoicePaymentPayload) => invoiceApi.addPayment(invoiceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.paymentSummary(invoiceId) });
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.details(invoiceId) });
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      options?.onSuccess?.();
    },
  });
}

export function useDownloadInvoicePdfMutation() {
  return useMutation({
    mutationFn: async ({
      invoiceId,
      invoiceNumber,
      language,
    }: {
      invoiceId: string;
      invoiceNumber: string;
      language: 'pl' | 'en';
    }) => {
      const pdfPayload = await invoiceApi.getInvoicePdf(invoiceId, language);
      downloadBase64Pdf(
        pdfPayload,
        `${language === 'en' ? 'Invoice' : 'Faktura'}_${invoiceNumber}.pdf`,
      );
    },
  });
}

interface UseInvoicePaymentsProps {
  invoiceId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
}

export function useInvoicePayments({
  invoiceId,
  pageNumber,
  pageSize,
  debouncedSearch,
}: UseInvoicePaymentsProps) {
  const queryParams: InvoicePaymentsParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
  };

  return useQuery({
    queryKey: invoiceKeys.payments(invoiceId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => invoiceApi.getPayments(invoiceId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(invoiceId),
  });
}

interface UseInvoiceProductsProps {
  invoiceId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
}

export function useInvoiceProducts({
  invoiceId,
  pageNumber,
  pageSize,
  debouncedSearch,
}: UseInvoiceProductsProps) {
  const queryParams: InvoiceProductsParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
  };

  return useQuery({
    queryKey: invoiceKeys.products(invoiceId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => invoiceApi.getProducts(invoiceId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(invoiceId),
  });
}
