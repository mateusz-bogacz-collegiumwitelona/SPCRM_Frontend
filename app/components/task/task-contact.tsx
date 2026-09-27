import { getIcon, getTypePrefix } from '~/components/contact/contact-icon';
import { type Contact } from '~/types/contact';
import { Building2, User } from 'lucide-react';
import { Link } from 'react-router';
import { useTaskContact } from '~/hooks/use-tasks';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

export const TaskContactDetails = ({ taskId }: Readonly<{ taskId: string }>) => {
  const { data: contact, isLoading, isError, error: queryError } = useTaskContact(taskId);

  if (isLoading) return <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />;

  if (isError) {
    return (
      <QueryErrorBanner
        error={queryError}
        fallbackMessage="Nie udało się pobrać danych zamówienia."
        className="mb-6"
      />
    );
  }

  if (!contact) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
        Brak przypisanego kontaktu do tego zadania.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6">
      <h2 className="text-lg font-normal text-gray-800 mb-4 flex items-center gap-2">
        <User className="text-brand w-5 h-5" /> Powiązany kontakt
      </h2>

      <div className="mb-4">
        <Link
          to={`/contacts/${contact.contactId}`}
          className="text-brand text-lg font-medium hover:underline"
        >
          {contact.firstName} {contact.lastName}
        </Link>
        {contact.jobTitle && <p className="text-sm text-gray-500">{contact.jobTitle}</p>}
        {contact.companyName && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> {contact.companyName}
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3">
        {contact.contactWays?.map((way: Contact) => (
          <div key={`${way.type}-${way.value}`} className="flex items-center text-sm">
            {getIcon(way.type)}

            <span className="font-medium text-gray-800">
              <span className="text-gray-500 font-normal mr-1">{getTypePrefix(way.type)}</span>
              {way.value}
            </span>

            {way.label && <span className="text-xs text-gray-400 ml-2">({way.label})</span>}
          </div>
        ))}
        {(!contact.contactWays || contact.contactWays.length === 0) && (
          <p className="text-sm text-gray-400 italic">Brak danych kontaktowych</p>
        )}
      </div>
    </div>
  );
};
