import { getIcon, getTypePrefix } from '~/utils/contact-helpers';
import { type ContactWay } from '~/interfaces/contact-way';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Building2, User } from 'lucide-react';
import { Link } from 'react-router';

interface TaskContactResponse {
  contactId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  companyName: string;
  contactWays: ContactWay[];
}

export const TaskContactDetails = ({ taskId }: { taskId: string }) => {
  const { data: contact, isLoading } = useQuery<TaskContactResponse>({
    queryKey: ['task-contact', taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/contact`);
        return response.data.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  if (isLoading) return <div className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>;

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
        <User className="text-[#004a8f] w-5 h-5" /> Powiązany kontakt
      </h2>

      <div className="mb-4">
        <Link
          to={`/contacts/${contact.contactId}`}
          className="text-[#004a8f] text-lg font-medium hover:underline"
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
        {contact.contactWays?.map((way: ContactWay, idx: number) => (
          // Usunąłem gap-3, ponieważ Twoja funkcja getIcon już dodaje margines (mr-2)
          <div key={idx} className="flex items-center text-sm">
            {/* 1. Użycie funkcji do pobrania odpowiedniej ikonki */}
            {getIcon(way.type)}

            <span className="font-medium text-gray-800">
              {/* 2. Użycie funkcji do dodania przedrostka (np. Tel:, Email:) */}
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
