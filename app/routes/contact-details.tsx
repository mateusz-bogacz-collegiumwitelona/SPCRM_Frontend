import React from 'react';
import { useParams } from 'react-router';
import { AuthGuard } from '~/lib/auth-guard';
import { MainLayout } from '~/components/main-layout';
import { ContactHeader } from '~/components/contact/contact-header';
import { ContactWays } from '~/components/contact/contact-ways';
import { ContactNotes } from '~/components/contact/contact-notes';

export default function ContactDetails() {
  const { contactId } = useParams<{ contactId: string }>();

  if (!contactId) return null;

  return (
    <AuthGuard allowedRoles={['User', 'Manager']}>
      <MainLayout>
        <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-6">
          <ContactHeader contactId={contactId} />
          <ContactWays contactId={contactId} />
          <ContactNotes contactId={contactId} />
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
