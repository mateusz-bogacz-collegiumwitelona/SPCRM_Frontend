import type { ContactResponse } from '~/types/contact';
import { Link } from 'react-router';

export const ContactMobileCard = ({
  contact,
  onEdit,
  onChangeOwner,
  onSetPrimary,
}: {
  readonly contact: ContactResponse;
  readonly onEdit: (id: string) => void;
  readonly onChangeOwner: (id: string) => void;
  readonly onSetPrimary: (id: string) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="overflow-hidden">
        <p className="text-sm font-bold text-blue-900 truncate">
          {contact.firstName} {contact.lastName}
        </p>
        {contact.jobTitle && (
          <p className="text-xs font-semibold text-gray-600 mb-1 truncate">{contact.jobTitle}</p>
        )}
        <p className="text-xs text-gray-500 mb-1">{contact.companyName}</p>
        <p className="text-sm text-gray-700">
          Opiekun: {contact.ownerFirstName || ''} {contact.ownerLastName || ''}
        </p>
      </div>
      {contact.isPrimary && (
        <span className="flex shrink-0 items-center justify-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Główny
        </span>
      )}
    </div>
    <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={() => onEdit(contact.id)}
        className="text-xs font-medium text-gray-500 hover:text-brand hover:underline"
      >
        Edytuj
      </button>

      <button
        type="button"
        onClick={() => onChangeOwner(contact.id)}
        className="text-xs font-medium text-gray-500 hover:text-brand hover:underline"
      >
        Zmień opiekuna
      </button>

      {!contact.isPrimary && (
        <button
          type="button"
          onClick={() => onSetPrimary(contact.id)}
          className="text-xs font-medium text-gray-500 hover:text-green-600 hover:underline"
        >
          Ustaw główny
        </button>
      )}
      <Link
        to={`/contact/${contact.id}`}
        className="text-xs font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    </div>
  </div>
);
