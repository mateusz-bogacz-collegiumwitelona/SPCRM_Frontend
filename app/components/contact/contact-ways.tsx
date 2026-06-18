import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Mail, Phone, Printer, Globe, ExternalLink } from 'lucide-react';

interface ContactWay {
  type: string;
  value: string;
  label?: string;
  isPrimary: boolean;
}

const getIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'EMAIL':
      return <Mail className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    case 'PHONE':
    case 'MOBILE_PHONE':
      return <Phone className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    case 'FAX':
      return <Printer className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    case 'LINKDIN':
      return <ExternalLink className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    default:
      return <Globe className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
  }
};

const getTypePrefix = (type: string) => {
  if (type.includes('PHONE')) return 'Tel:';
  if (type === 'EMAIL') return 'Email:';
  if (type === 'LINKDIN') return 'LinkedIn:';
  if (type === 'FAX') return 'Fax:';
  return '';
};

export const ContactWays: React.FC<{ contactId: string }> = ({ contactId }) => {
  const { data: ways, isLoading } = useQuery<ContactWay[]>({
    queryKey: ['contact-ways', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/ways`);
      return res.data.data;
    },
  });

  if (isLoading || !ways || ways.length === 0) return null;

  return (
    <div className="border border-gray-800 rounded-xl p-4 bg-white shadow-sm">
      <ul className="space-y-3">
        {ways.map((way, index) => (
          <li key={index} className="flex items-center text-sm text-gray-800">
            {getIcon(way.type)}
            <span className="font-medium mr-1">{getTypePrefix(way.type)}</span>
            <span>{way.value}</span>
            {way.label && <span className="text-xs text-gray-400 ml-2">({way.label})</span>}
            {way.isPrimary && (
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-[#d4edda] text-[#28a745] px-2 py-0.5 rounded-full">
                Główny
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
