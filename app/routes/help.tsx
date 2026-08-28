import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import type ApiError from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: SupportFormData) => {
      const response = await api.post('mailing/support', payload);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage('Wiadomość została wysłana pomyślnie. Skontaktujemy się z Tobą wkrótce.');
      setErrorMessage(null);
      setFormData({ email: '', title: '', message: '' });
    },
    onError: (error: unknown) => {
      setSuccessMessage(null);
      const err = error as ApiError;
      const errorData = err.response?.data;

      if (
        errorData?.errorCode === 'VALIDATION_ERROR' &&
        errorData.errors &&
        errorData.errors.length > 0
      ) {
        const validationMessage = errorData.errors.map((code) => getErrorMessage(code)).join(' ');
        setErrorMessage(validationMessage);
      } else if (errorData?.errorCode) {
        setErrorMessage(getErrorMessage(errorData.errorCode, errorData.message));
      } else {
        setErrorMessage(err.message || 'Wystąpił nieznany błąd.');
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(formData);
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

            <form onSubmit={handleSubmit} className="mt-8 space-y-5 lg:mt-10 lg:space-y-6">
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
                  required
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
                  required
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
                    required
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-[#7f8490]">
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 sm:text-[13px]">
                  {errorMessage}
                </p>
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
