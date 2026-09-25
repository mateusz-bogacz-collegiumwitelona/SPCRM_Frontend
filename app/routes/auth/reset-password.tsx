import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, X } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = searchParams.get('userId') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const isLinkInvalid = !userId.trim() || !token.trim();

  const resetMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        userId,
        token,
        password,
        confirmPassword,
      };
      const response = await api.post('/auth/reset-password', payload);
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
          errorData?.message || apiError.message || 'Wystąpił błąd podczas resetowania hasła.',
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
      validationErrors.push('Nowe hasło jest wymagane.');
    } else if (password.length < 8) {
      validationErrors.push('Hasło musi zawierać co najmniej 8 znaków.');
    }

    if (!confirmPassword) {
      validationErrors.push('Potwierdzenie hasła jest wymagane.');
    } else if (password !== confirmPassword) {
      validationErrors.push('Hasła nie są identyczne.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    resetMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="mx-auto max-w-300 px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <Card className="mx-auto w-full max-w-140 rounded-2xl border border-[#d6d9dd] bg-white py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)] mt-12 sm:mt-16">
          <CardContent className="px-5 py-8 sm:px-8 sm:py-10">
            {isLinkInvalid ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Nieprawidłowy lub wygasły link
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                  Parametry weryfikacyjne w adresie URL są niekompletne. Upewnij się, że cały link
                  został skopiowany z wiadomości e-mail lub wygeneruj nową prośbę o reset hasła.
                </p>
                <div className="flex justify-center gap-3">
                  <Button asChild variant="outline" className="border-gray-300">
                    <Link to="/auth/forgot-password">Zgłoś ponownie</Link>
                  </Button>
                  <Button asChild className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90">
                    <Link to="/">Strona logowania</Link>
                  </Button>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Hasło zostało zmienione!</h1>
                <p className="text-sm text-gray-600 mb-6">
                  Twoje nowe hasło zostało pomyślnie ustawione. Możesz teraz zalogować się do
                  systemu przy użyciu nowych danych dostępowych.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90 px-8"
                >
                  Przejdź do logowania
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#004a8f] mb-3">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Ustaw nowe hasło</h1>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Wprowadź i potwierdź nowe hasło do swojego konta w systemie.
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
                            <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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
                      htmlFor="reset-password"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Nowe hasło *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-gray-300 rounded-md pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004a8f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-confirm-password"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Powtórz nowe hasło *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-gray-300 rounded-md pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004a8f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={resetMutation.isPending}
                    className="w-full bg-[#004a8f] text-white hover:bg-[#004a8f]/90 flex items-center justify-center gap-2 h-10 mt-2"
                  >
                    {resetMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...
                      </>
                    ) : (
                      'Zresetuj hasło'
                    )}
                  </Button>
                </form>

                <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                  <Link
                    to="/"
                    className="text-xs font-medium text-gray-600 hover:text-[#004a8f] transition-colors"
                  >
                    Powrót do logowania
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
