import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, X } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export default function ConfirmRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email: email,
        token: token,
        password: password,
        confirmPassword: confirmPassword,
      };

      const response = await api.post('/user/confirm-email', payload);
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
          errorData?.message || apiError.message || 'Wystąpił błąd podczas aktywacji konta.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!password) {
      validationErrors.push('Hasło jest wymagane.');
    } else if (password.length < 8) {
      validationErrors.push('Hasło musi mieć co najmniej 8 znaków.');
    }

    if (password !== confirmPassword) {
      validationErrors.push('Hasła nie są identyczne.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    confirmMutation.mutate();
  };

  const isLinkInvalid = !token.trim() || !email.trim();

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="mx-auto max-w-300 px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <Card className="mx-auto w-full max-w-170 rounded-2xl border border-[#d6d9dd] bg-white py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)] mt-12 sm:mt-20">
          <CardContent className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            {isLinkInvalid ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Nieprawidłowy link aktywacyjny
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                  Link aktywacyjny jest niekompletny lub wygasł. Upewnij się, że skopiowano cały
                  adres z wiadomości e-mail.
                </p>
                <Button asChild className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90">
                  <Link to="/">Przejdź do logowania</Link>
                </Button>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Konto zostało aktywowane!</h1>
                <p className="text-sm text-gray-600 mb-6">
                  Twój adres e-mail został potwierdzony, a nowe hasło zostało pomyślnie ustawione.
                  Możesz się teraz zalogować do systemu.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90 w-full sm:w-auto px-8"
                >
                  Zaloguj się
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#004a8f] mb-3">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h1 className="text-[24px] font-semibold text-[#004a8f] sm:text-[28px]">
                    Aktywacja konta
                  </h1>
                  <p className="mt-2 text-[14px] text-gray-600">
                    Dokończ konfigurację konta dla adresu:{' '}
                    <strong className="text-gray-900">{email}</strong>
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                  {formError && (
                    <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-xs shadow-xs transition-all text-left">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1 pr-3">
                        <p className="font-medium leading-tight">{formError.title}</p>
                        {formError.details && formError.details.length > 0 && (
                          <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-[11px] text-red-700">
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

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-[13px] font-medium text-[#004a8f] sm:text-[14px]"
                    >
                      Nowe hasło *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Wpisz nowe hasło (min. 8 znaków)"
                        className="h-10 w-full rounded-[3px] border border-[#d9dce1] bg-white px-3 pr-10 text-[13px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[13px] font-medium text-[#004a8f] sm:text-[14px]"
                    >
                      Powtórz nowe hasło *
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Wpisz ponownie hasło"
                      className="h-10 w-full rounded-[3px] border border-[#d9dce1] bg-white px-3 text-[13px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={confirmMutation.isPending}
                    className="mt-6 h-10 w-full rounded-[5px] bg-[#004a8f] text-[13px] font-medium text-white hover:bg-[#004a8f]/95 flex items-center justify-center gap-2"
                  >
                    {confirmMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Aktywowanie konta...
                      </>
                    ) : (
                      'Potwierdź i ustaw hasło'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
