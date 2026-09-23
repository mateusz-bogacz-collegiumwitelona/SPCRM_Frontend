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

export interface LeaderboardItemResponse {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  revenueThisMonth: CurrencyAmountResponse[];
  wonDealsThisMonth: number;
  activeDealsCount: number;
  winRatePercentageThisMonth: number;
}
