import { ExternalLink, Globe, Mail, Phone, Printer } from 'lucide-react';
import React from 'react';

const getIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'EMAIL':
      return <Mail className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    case 'PHONE':
    case 'PHONE_MOBILE':
      return <Phone className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    case 'FAX':
      return <Printer className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    case 'LINKEDIN':
      return <ExternalLink className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
    default:
      return <Globe className="w-4 h-4 text-gray-500 mr-2 shrink-0" />;
  }
};

const getTypePrefix = (type: string) => {
  const upperType = type.toUpperCase();
  if (upperType.includes('PHONE')) return 'Tel:';
  if (upperType === 'EMAIL') return 'Email:';
  if (upperType === 'LINKEDIN') return 'LinkedIn:';
  if (upperType === 'FAX') return 'Fax:';
  return '';
};

export { getIcon, getTypePrefix };
