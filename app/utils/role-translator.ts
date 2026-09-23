import type { RoleConfig } from '~/interfaces/user';

export const translateRole = (rawRole?: string | null): string => {
  const role = (rawRole || '').toLowerCase();

  switch (role) {
    case 'admin':
      return 'Administrator';

    case 'manager':
      return 'Menadżer';

    case 'user':
      return 'Pracownik';

    default:
      return rawRole || 'Brak roli';
  }
};

export const getRoleConfig = (rawRole?: string | null): RoleConfig => {
  const role = (rawRole || '').toLowerCase();

  switch (role) {
    case 'admin':
      return {
        label: 'Administrator',
        bgColor: 'bg-fuchsia-100',
        textColor: 'text-fuchsia-800',
        iconColor: 'text-fuchsia-700',
      };

    case 'manager':
      return {
        label: 'Menadżer',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-800',
        iconColor: 'text-indigo-700',
      };

    case 'user':
      return {
        label: 'Pracownik',
        bgColor: 'bg-olive-50',
        textColor: 'text-olive-800',
        iconColor: 'text-olive-700',
      };

    default:
      return {
        label: rawRole || 'Brak roli',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-500',
      };
  }
};
