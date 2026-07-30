import React from 'react';
import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { ContactHeader } from '~/components/contact/contact-header';
import { ContactWays } from '~/components/contact/contact-ways';
import { ContactNotes } from '~/components/contact/contact-notes';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';

export default function ContactDetails() {
  const { contactId } = useParams<{ contactId: string }>();

  if (!contactId) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="w-full mx-auto p-4 lg:p-6">
            <ContactHeader contactId={contactId} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1">
                <ContactWays contactId={contactId} />
              </div>

              <div className="lg:col-span-2">
                <ContactNotes contactId={contactId} />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
