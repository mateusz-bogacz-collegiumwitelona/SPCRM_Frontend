export interface Contact {
  type: string;
  value: string;
  label?: string;
  isPrimary: boolean;
}

export interface AddContactRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  details: AddContactDetailRequest[];
}

export interface AddContactDetailRequest {
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface ContactNote {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
}

export interface EditContactDetailRequest {
  contactDetailId: string | null;
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface EditContactRequest {
  contactId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  details: EditContactDetailRequest[];
}

export interface ContactDetailResponse {
  contactDetailId: string;
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface ContactTaskItem {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
  assignedToId: string;
  assignedToFirstName: string;
  assignedToLastName: string;
  dealId?: string | null;
  dealName?: string | null;
}

export interface ContactOption {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
}

export interface UserContactItem {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  companyName: string;
  isPrimary: boolean;
}
