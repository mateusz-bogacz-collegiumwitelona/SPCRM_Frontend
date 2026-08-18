export const translateRole = (role: string): string => {
  const translations: Record<string, string> = {
    Admin: 'Administrator',
    User: 'Pracownik',
    Manager: 'Manager',
  };

  return translations[role] || role;
};
