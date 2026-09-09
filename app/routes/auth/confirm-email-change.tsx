import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Navbar } from '~/components/layout/unloged-navbar';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export default function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = searchParams.get('userId') || '';
  const rawToken = searchParams.get('token') || '';
  const token = rawToken.replaceAll(' ', '+');

  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        userId,
        token,
      };
      const response = await api.post('/user/confirm-email-change', payload);
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
            'Wystąpił błąd podczas potwierdzania adresu e-mail.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });

  const isLinkInvalid = !userId.trim() || !token.trim();

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="mx-auto max-w-300 px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <Card className="mx-auto w-full max-w-160 rounded-2xl border border-[#d6d9dd] bg-white py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)] mt-12 sm:mt-20">
          <CardContent className="px-5 py-8 sm:px-8 sm:py-10 text-center">
            {isLinkInvalid ? (
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Nieprawidłowy link weryfikacyjny
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                  Parametry autoryzacyjne w linku są niekompletne lub wygasły. Upewnij się, że cały
                  adres z wiadomości e-mail został skopiowany poprawnie.
                </p>
                <Button asChild className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90">
                  <Link to="/">Przejdź do logowania</Link>
                </Button>
              </div>
            ) : isSuccess ? (
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Adres e-mail został zaktualizowany!
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                  Twój nowy adres e-mail został pomyślnie potwierdzony. Możesz teraz zalogować się
                  do systemu przy użyciu nowego adresu.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90 px-8"
                >
                  Zaloguj się
                </Button>
              </div>
            ) : (
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#004a8f] mb-4">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Potwierdzenie zmiany adresu e-mail
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                  Kliknij poniższy przycisk, aby zatwierdzić nowy adres e-mail przypisany do Twojego
                  konta.
                </p>

                {formError && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left text-xs text-red-700">
                    <p className="font-semibold mb-1">{formError.title}</p>
                    {formError.details && (
                      <ul className="list-disc list-inside space-y-0.5">
                        {formError.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                  className="bg-[#004a8f] text-white hover:bg-[#004a8f]/90 px-8 flex items-center gap-2 mx-auto"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Weryfikacja...
                    </>
                  ) : (
                    'Potwierdź zmianę e-maila'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
