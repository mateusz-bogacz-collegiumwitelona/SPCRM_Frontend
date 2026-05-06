import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

import { useNavigate } from "react-router";
import { useAuth } from "~/context/authContext";

export default function Dashboard() {
  // @ts-ignore
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-[#e8e8e8] p-6">
      <div className="mx-auto max-w-[900px]">
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
    </main>
  );
}
