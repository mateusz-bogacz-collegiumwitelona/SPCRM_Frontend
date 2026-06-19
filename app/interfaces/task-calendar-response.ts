export interface TaskCalendarResponse {
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
