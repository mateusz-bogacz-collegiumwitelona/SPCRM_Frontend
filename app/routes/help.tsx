import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import { AlertCircle, X } from 'lucide-react';

interface SupportFormData {
  email: string;
  title: string;
  message: string;
}

export default function Help() {
  const [formData, setFormData] = useState<SupportFormData>({
    email: '',
    title: '',
    message: '',
  });

  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: SupportFormData) => {
      const response = await api.post('mailing/support', payload);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage('Wiadomość została wysłana pomyślnie. Skontaktujemy się z Tobą wkrótce.');
      setFormError(null);
      setFormData({ email: '', title: '', message: '' });
    },
    onError: (error: unknown) => {
      setSuccessMessage(null);
      const err = error as ApiError;
      const errorData = err.response?.data;

      const code = errorData?.errorCode;
      const fallback = errorData?.message || err.message || 'Wystąpił nieznany błąd.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          errorData?.errors && errorData.errors.length > 0
            ? errorData.errors.map((item) => getErrorMessage(item, item))
            : undefined,
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const validationErrors: string[] = [];
    const trimmedEmail = formData.email.trim();
    const trimmedTitle = formData.title.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedEmail) {
      validationErrors.push('Adres email jest wymagany.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      validationErrors.push('Podaj poprawny adres email.');
    }

    if (!trimmedTitle) {
      validationErrors.push('Tytuł zgłoszenia jest wymagany.');
    }

    if (!trimmedMessage) {
      validationErrors.push('Treść wiadomości jest wymagana.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    mutate({
      email: trimmedEmail,
      title: trimmedTitle,
      message: trimmedMessage,
    });
  };

  const characterCount = formData.message.length;
  const maxCharacters = 5000;

  return (
    <main className="min-h-screen bg-white pt-20">
      <Navbar />

      <section className="mx-auto max-w-300 px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <div className="mx-auto w-full max-w-170 rounded-2xl border border-[#d6d9dd] bg-white py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <h1 className="text-center text-[24px] leading-none text-[#004a8f] sm:text-[30px] lg:text-[36px]">
              Pomoc techniczna
            </h1>
            <p className="mt-4 text-center text-[14px] leading-normal text-[#1f1f1f] sm:text-[18px] lg:text-[20px]">
              Podaj dane, aby zgłosić problem
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 space-y-5 lg:mt-10 lg:space-y-6"
            >
              <div className="space-y-2">
                <label
                  htmlFor="email-input"
                  className="block text-[14px] text-[#004a8f] sm:text-[16px]"
                >
                  Email
                </label>
                <Input
                  id="email-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@example.com"
                  className="h-9 w-full rounded-[3px] border border-[#d9dce1] bg-white px-2 text-[12px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30 sm:h-10 sm:text-[14px] lg:h-11"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="title-input"
                  className="block text-[14px] text-[#004a8f] sm:text-[16px]"
                >
                  Tytuł
                </label>
                <Input
                  id="title-input"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Przykładowy tytuł"
                  className="h-9 w-full rounded-[3px] border border-[#d9dce1] bg-white px-2 text-[12px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30 sm:h-10 sm:text-[14px] lg:h-11"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message-input"
                  className="block text-[14px] text-[#004a8f] sm:text-[16px]"
                >
                  Treść
                </label>
                <div className="relative">
                  <Textarea
                    id="message-input"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Przykładowa treść"
                    className="w-full rounded-[3px] border border-[#d9dce1] bg-white px-2 text-[12px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30 min-h-50 sm:text-[14px]"
                    maxLength={maxCharacters}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-[#7f8490]">
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-xs shadow-xs transition-all text-left">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 pr-4">
                    <p className="font-medium leading-tight">{formError.title}</p>
                    {formError.details && formError.details.length > 0 && (
                      <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                        {formError.details.map((detailErr, idx) => (
                          <li key={idx}>{detailErr}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                    title="Zamknij"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {successMessage && (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700 sm:text-[13px]">
                  {successMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="mt-6 h-8.5 w-full rounded-[5px] bg-[#004a8f] text-[12px] text-white hover:bg-[#004a8f]/95 sm:h-10 sm:text-[14px] lg:h-11"
              >
                {isPending ? 'Wysyłanie...' : 'Wyślij'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
