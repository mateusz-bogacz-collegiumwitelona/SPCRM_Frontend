import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { MainLayout } from '~/components/main-layout';
import { AuthGuard } from '~/lib/auth-guard';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#e8e8e8] p-6">
        <MainLayout>
          <div className="mx-auto max-w-225">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Zalogowano pomyslnie jak user.</p>
                <Button onClick={handleLogout}>Wroc do logowania</Button>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      </main>
    </AuthGuard>
  );
}
