import type { Contact } from '~/types/contact';

export interface Task {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactId?: string;
  dealName?: string;
  dealId?: string;
}

export interface AddTaskRequestPayload {
  title: string;
  description: string;
  dueAt: string;
  priority: string;
  assignedToId?: string | null;
}

export interface ChangeTaskStatusPayload {
  taskId: string;
  status: string;
}

export interface EditTaskRequestPayload {
  title?: string;
  description?: string;
  priority?: string;
}

export interface ExtendTaskDueDatePayload {
  newDueDate: string;
}

export interface UserTaskItem {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
}

export interface DictionaryItem {
  value: string;
  label: string;
}

export interface TaskDictionariesData {
  statuses: DictionaryItem[];
  priorities: DictionaryItem[];
}

export interface CalendarTasksParams {
  dateFrom: string;
  dateTo: string;
  status?: string;
  priority?: string;
}

export interface TaskDictionariesResponse {
  statuses: { value: string; label: string }[];
  priorities: { value: string; label: string }[];
}

export interface SaleTaskResponse {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
  assignedToId: string;
  assignedToFirstName: string;
  assignedToLastName: string;
  contactId?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

export interface DealTasksParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  status?: string;
  priority?: string;
}

export interface SaleTaskResponse {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
  assignedToId: string;
  assignedToFirstName: string;
  assignedToLastName: string;
  contactId?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

export interface DealTasksParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  status?: string;
  priority?: string;
}

export interface TaskContactResponse {
  contactId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  companyName: string;
  contactWays: Contact[];
}

export interface TaskDealResponse {
  dealId: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
}
