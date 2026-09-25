import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Compass, HelpCircle, Home, LogIn } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Navbar as UnloggedNavbar } from '~/components/layout/unloged-navbar';
import { MainLayout } from '~/components/layout/main-layout';
import { useAuth } from '~/context/auth-context';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLogged = Boolean(user);
  const homePath = isLogged ? '/dashboard' : '/';
  const homeLabel = isLogged ? 'Przejdź do Dashboardu' : 'Strona logowania';

  const ErrorCard = (
    <div className="mx-auto w-full max-w-170 rounded-2xl border border-[#d6d9dd] bg-white p-8 sm:p-12 shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#004a8f]">
        <Compass className="h-10 w-10 stroke-[1.5]" />
      </div>

      <span className="text-sm font-semibold tracking-wider text-[#004a8f] uppercase">
        Błąd 404
      </span>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Nie znaleziono strony
      </h1>

      <p className="mt-4 text-sm sm:text-base text-gray-500 max-w-md mx-auto">
        Strona, której szukasz, mogła zostać przeniesiona, usunięta lub wpisany adres URL jest
        niepoprawny.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto h-10 px-5 text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć wstecz</span>
        </Button>

        <Button
          type="button"
          onClick={() => navigate(homePath)}
          className="w-full sm:w-auto h-10 px-6 bg-[#004a8f] text-white hover:bg-blue-800 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {isLogged ? <Home className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          <span>{homeLabel}</span>
        </Button>
      </div>

      <div className="mt-10 border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span>Coś nie działa poprawnie?</span>
          <Link to="/help" className="font-medium text-[#004a8f] hover:underline">
            Skontaktuj się z pomocą
          </Link>
        </p>
      </div>
    </div>
  );

  if (isLogged) {
    return (
      <MainLayout>
        <div className="py-8 lg:py-16 flex items-center justify-center">{ErrorCard}</div>
      </MainLayout>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <UnloggedNavbar />
      <section className="mx-auto max-w-300 px-4 pb-14 pt-28 sm:pt-32 lg:pt-36">
        {ErrorCard}
      </section>
    </main>
  );
}
