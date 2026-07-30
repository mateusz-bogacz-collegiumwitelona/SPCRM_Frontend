import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { NavigationBar } from '~/components/layout/navigation-bar';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin']}>
        <main className="min-h-screen bg-[#e8e8e8] p-6">
          <div className="mx-auto max-w-225">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Zalogowano pomyslnie jako admin.</p>
                <Button onClick={handleLogout}>Wroc do logowania</Button>
              </CardContent>
            </Card>
          </div>
          <NavigationBar />
        </main>
      </RoleGuard>
    </AuthGuard>
  );
}
