import React, { useState } from "react";
import { Eye, EyeOff, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { API_URL } from "~/config";
import { useAuth } from "~/context/authContext";
import { log } from "console";

export default function Home() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!API_URL) {
      setError("Brak konfiguracji API.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && response.isSuccess) {
        const user = data.data;
        if (data?.token) {
          localStorage.setItem("token", data.token);
        }
        login(data);
      } else {
        const errorMessage =
          data?.errors?.length > 0
            ? data.errors[0]
            : data?.message || "Nieudane logowanie. Sprobuj ponownie.";
        setError(errorMessage);
      }
    } catch {
      setError("Blad polaczenia z serwerem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e8e8e8]">
      <header className="h-20 w-full rounded-b-[10px] bg-[#004a8f] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-end px-4 lg:px-8">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center text-white"
            aria-label="Open menu"
          >
            <Menu className="size-8" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-8 lg:px-8 lg:pt-14">
        <Card className="mx-auto w-full max-w-[680px] rounded-2xl border border-[#d6d9dd] bg-[#ebebeb] py-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
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
              onSubmit={handleLogin}
            >
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-[14px] text-[#004a8f] sm:text-[16px]"
                >
                  Nazwa uzytkownika lub Email
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Twoja nazwa uzytkownika"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="h-9 w-full rounded-[3px] border border-[#d9dce1] bg-[#efefef] px-2 text-[12px] text-[#1f1f1f] 
                  placeholder:text-[#d0d2d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30 
                  sm:h-10 sm:text-[14px] lg:h-11"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[14px] text-[#004a8f] sm:text-[16px]"
                >
                  Haslo
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-9 w-full rounded-[3px] border border-[#d9dce1] bg-[#efefef] px-2 pr-10 
                    text-[12px] text-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 
                    focus-visible:ring-[#004a8f]/30 sm:h-10 sm:text-[14px] lg:h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-sm p-1 
                    text-[#7f8490] hover:text-[#5c6270] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004a8f]/30"
                    aria-label={showPassword ? "Ukryj haslo" : "Pokaz haslo"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" strokeWidth={2} />
                    ) : (
                      <Eye className="size-[18px]" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1 text-[12px] text-[#004a8f] sm:text-[14px]">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-5 rounded-[1px] border border-[#d9dce1] accent-[#004a8f]"
                  />
                  Zapamietaj mnie
                </label>
                <a href="#" className="hover:underline">
                  Przypomnij haslo
                </a>
              </div>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 sm:text-[13px]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-6 h-[34px] w-full rounded-[5px] bg-[#004a8f] text-[12px] text-white 
                hover:bg-[#004a8f]/95 sm:h-10 sm:text-[14px] lg:h-11"
              >
                {isLoading ? "Logowanie..." : "Zaloguj sie"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
