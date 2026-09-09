export interface RoleConfig {
  label: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

export const getRoleConfig = (rawRole?: string | null): RoleConfig => {
  const role = (rawRole || '').toLowerCase();

  switch (role) {
    case 'admin':
      return {
        label: 'Administrator',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        iconColor: 'text-purple-700',
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
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-700',
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

export const ROLE_FILTER_OPTIONS = [
  { value: 'Admin', label: getRoleConfig('Admin').label },
  { value: 'Manager', label: getRoleConfig('Manager').label },
  { value: 'User', label: getRoleConfig('User').label },
];
