import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { useAuth } from '~/context/auth-context';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';

export default function Home() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.roles.includes('Admin')) {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.roles.includes('Manager')) {
        navigate('/manager-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, user, navigate]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('auth/login', {
        name: name.trim(),
        password,
      });
      return response.data;
    },
    onSuccess: async () => {
      setFormError(null);
      await login();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const status = apiError.response?.status;
      const errorData = apiError.response?.data;

      if (status === 401) {
        setFormError({
          title: 'Niepoprawny login lub hasło.',
          details: [
            'Upewnij się, że wpisane dane są prawidłowe oraz czy konto ma potwierdzony adres e-mail.',
          ],
        });
        return;
      }

      if (errorData?.errorCode) {
        setFormError({
          title: getErrorMessage(errorData.errorCode, errorData.message),
          details: errorData.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
        });
        return;
      }

      setFormError({
        title: apiError.message || 'Wystąpił błąd podczas logowania.',
      });
    },
  });

  const handleLogin = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push('Nazwa użytkownika lub e-mail jest wymagany.');
    if (!password) validationErrors.push('Hasło jest wymagane.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    loginMutation.mutate();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#004a8f]" />
      </main>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="mx-auto max-w-300 px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <Card className="mx-auto w-full max-w-170 rounded-2xl border border-[#d6d9dd] bg-white py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)] mt-20">
          <CardContent className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <h1 className="text-center text-[24px] leading-none text-[#004a8f] sm:text-[30px] lg:text-[36px]">
              Logowanie
            </h1>
            <p className="mt-4 text-center text-[14px] leading-normal text-[#1f1f1f] sm:text-[18px] lg:text-[20px]">
              Podaj dane, aby się zalogować
            </p>

            <form
              className="mt-8 space-y-5 lg:mt-10 lg:space-y-6"
              aria-label="Formularz logowania"
              noValidate
              onSubmit={handleLogin}
            >
              <div className="space-y-2">
                <label htmlFor="name" className="block text-[14px] text-[#004a8f] sm:text-[16px]">
                  Nazwa uzytkownika lub Email
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Twoja nazwa uzytkownika"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-9 w-full rounded-[3px] border border-[#d9dce1] bg-white px-2 text-[12px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30 sm:h-10 sm:text-[14px] lg:h-11"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[14px] text-[#004a8f] sm:text-[16px]"
                >
                  Hasło
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-9 w-full rounded-[3px] border border-[#d9dce1] bg-white px-2 pr-10 text-[12px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30 sm:h-10 sm:text-[14px] lg:h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-sm p-1 text-[#7f8490] hover:text-[#5c6270] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30"
                    aria-label={showPassword ? 'Ukryj haslo' : 'Pokaz haslo'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4.5" strokeWidth={2} />
                    ) : (
                      <Eye className="size-4.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1 text-[12px] text-[#004a8f] sm:text-[14px]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-5 rounded-[1px] border border-[#d9dce1] accent-[#004a8f]"
                  />
                  <span>Zapamietaj mnie</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormError({
                      title: 'Resetowanie hasła',
                      details: [
                        'Skontaktuj się z administratorem systemu w celu zresetowania lub odzyskania hasła.',
                      ],
                    })
                  }
                  className="hover:underline bg-transparent border-none p-0 text-[#004a8f] cursor-pointer"
                >
                  Przypomnij haslo
                </button>
              </div>

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

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-6 h-8.5 w-full rounded-[5px] bg-[#004a8f] text-[12px] text-white hover:bg-[#004a8f]/95 sm:h-10 sm:text-[14px] lg:h-11 flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Logowanie...
                  </>
                ) : (
                  'Zaloguj sie'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
