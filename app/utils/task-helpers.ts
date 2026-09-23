export const FALLBACK_TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'Do zrobienia',
  inprogress: 'W trakcie',
  complete: 'Zakończone',
  break: 'Wstrzymane',
};

export const FALLBACK_TASK_PRIORITY_LABELS: Record<string, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
};

export const getTaskStatusBadgeClass = (status?: string | null): string => {
  switch (status?.toLowerCase()) {
    case 'complete':
      return 'bg-green-100 text-green-700';
    case 'inprogress':
      return 'bg-blue-100 text-blue-700';
    case 'break':
      return 'bg-orange-100 text-orange-700';
    case 'todo':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export const getTaskPriorityBadgeClass = (priority?: string | null): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const resolveTaskStatusLabel = (
  rawStatus?: string | null,
  dynamicResolver?: (val: string) => string | undefined,
): string => {
  if (!rawStatus) return '-';
  if (dynamicResolver) {
    const dynamic = dynamicResolver(rawStatus);
    if (dynamic && dynamic !== rawStatus) return dynamic;
  }
  return FALLBACK_TASK_STATUS_LABELS[rawStatus.toLowerCase()] || rawStatus;
};

export const resolveTaskPriorityLabel = (
  rawPriority?: string | null,
  dynamicResolver?: (val: string) => string | undefined,
): string => {
  if (!rawPriority) return '-';
  if (dynamicResolver) {
    const dynamic = dynamicResolver(rawPriority);
    if (dynamic && dynamic !== rawPriority) return dynamic;
  }
  return FALLBACK_TASK_PRIORITY_LABELS[rawPriority.toLowerCase()] || rawPriority;
};
