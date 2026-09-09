import React, { useState } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, X } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const mutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await api.post('/auth/forgot-password', { email: userEmail });
      return response.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      setFormError(null);
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const errorData = apiError.response?.data;

      setFormError({
        title: getErrorMessage(
          errorData?.errorCode,
          errorData?.message ||
            apiError.message ||
            'Wystąpił błąd podczas wysyłania linku resetującego.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    const validationErrors: string[] = [];

    if (!trimmedEmail) {
      validationErrors.push('Adres e-mail jest wymagany.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      validationErrors.push('Wprowadzono niepoprawny format adresu e-mail.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    mutation.mutate(trimmedEmail);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="mx-auto max-w-300 px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <Card className="mx-auto w-full max-w-140 rounded-2xl border border-[#d6d9dd] bg-white py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)] mt-12 sm:mt-16">
          <CardContent className="px-5 py-8 sm:px-8 sm:py-10">
            {isSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Sprawdź swoją skrzynkę e-mail
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                  Jeśli konto przypisane do adresu{' '}
                  <strong className="text-gray-900">{email}</strong> istnieje w systemie, wysłaliśmy
                  na nie wiadomość z linkiem umożliwiającym ustawienie nowego hasła.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild variant="outline" className="w-full sm:w-auto border-gray-300">
                    <Link to="/">Wróć do logowania</Link>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                    className="w-full sm:w-auto bg-[#004a8f] text-white hover:bg-[#004a8f]/90"
                  >
                    Wyślij ponownie
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#004a8f] mb-3">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Zapomniałeś hasła?</h1>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Podaj adres e-mail powiązany z Twoim kontem. Prześlemy instrukcje i link do
                    zresetowania hasła.
                  </p>
                </div>

                {formError && (
                  <div className="mb-5 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
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

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Adres e-mail *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="twoj.email@firma.pl"
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004a8f]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-[#004a8f] text-white hover:bg-[#004a8f]/90 flex items-center justify-center gap-2 h-10"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Wysyłanie...
                      </>
                    ) : (
                      'Wyślij link resetujący'
                    )}
                  </Button>
                </form>

                <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#004a8f] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Wróć do logowania
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
