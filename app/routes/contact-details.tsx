import React from 'react';
import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { ContactHeader } from '~/components/contact/contact-header';
import { ContactWays } from '~/components/contact/contact-ways';
import { ContactNotes } from '~/components/contact/contact-notes';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { ContactTasks } from '~/components/contact/contact-tasks';
import { api, isNotFoundError } from '~/api/api';
import NotFound from '~/routes/not-found';
import { useQuery } from '@tanstack/react-query';
import { PageLoader } from '~/components/layout/page-loader';
import { STANDARD_ROLES } from '~/constants/roles';

export default function ContactDetails() {
  const { contactId } = useParams<{ contactId: string }>();

  const { isLoading, error } = useQuery({
    queryKey: ['contact-details', contactId],
    queryFn: async () => (await api.get(`/contacts/${contactId}`)).data.data,
    enabled: !!contactId,
    retry: false,
  });

  if (!contactId || isNotFoundError(error)) {
    return <NotFound />;
  }

  if (isLoading) {
    return <PageLoader message="Wczytywanie szczegółów kontaktu..." />;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="w-full mx-auto p-4 lg:p-6">
            <ContactHeader contactId={contactId} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1">
                <ContactWays contactId={contactId} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <ContactTasks contactId={contactId} />
                <ContactNotes contactId={contactId} />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
