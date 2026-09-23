export interface CurrencyAmountResponse {
  currencyCode: string;
  decimalPlaces: number;
  amount: number;
}

export interface TeamKpiSummaryResponse {
  revenueThisWeek: CurrencyAmountResponse[];
  revenueThisMonth: CurrencyAmountResponse[];
  revenueThisYear: CurrencyAmountResponse[];

  activeDealsCount: number;
  wonDealsThisMonth: number;
  lostDealsThisMonth: number;

  completedTasksThisMonth: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
}
