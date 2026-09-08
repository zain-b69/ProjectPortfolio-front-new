import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, Mail, Lock, Waves, BarChart3, ShieldCheck } from "lucide-react";
import loginHeroBg from "@/assets/login-hero-bg.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/authService.ts";
import * as React from "react";
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — ProjectPortfolio DTI ONEE" },
      {
        name: "description",
        content:
          "Accès sécurisé à la plateforme de gestion des portefeuilles projets DTI de l'ONEE Branche Eau.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      await navigate({ to: "/dashboard" });
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.1fr_1fr]">
      {/* Left: institutional visual */}
      <div
        className="relative hidden overflow-hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: `url(${loginHeroBg})` }}
      >
        <div className="absolute inset-0 bg-primary/50" />
        <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/35 to-primary/20" />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-white/15 ring-1 ring-white/20">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">ONEE · Branche Eau</p>
              <p className="text-xs text-white/70">Direction des Technologies de l'Information</p>
            </div>
          </div>

          <div className="max-w-md space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Plateforme interne DTI
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight">ProjectPortfolio</h1>
              <p className="mt-3 text-base text-white/80">
                Gestion des portefeuilles projets DTI — pilotage rigoureux des projets, budgets,
                ressources et risques.
              </p>
            </div>
            <ul className="space-y-3 border-t border-white/15 pt-6">
              {[
                { icon: BarChart3, label: "Tableaux de bord et indicateurs de pilotage" },
                { icon: Waves, label: "Suivi des projets stratégiques Eau & SI" },
                { icon: ShieldCheck, label: "Gouvernance, budgets et risques maîtrisés" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-white/90">
                  <Icon className="h-4 w-4 shrink-0 text-white/70" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} ONEE — Usage interne réservé à la DTI.
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center bg-card p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">ProjectPortfolio</p>
              <p className="text-xs text-muted-foreground">DTI · ONEE Branche Eau</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Connexion à votre espace
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Utilisez vos identifiants ONEE pour accéder à la plateforme.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {error ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Adresse email professionnelle
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 pl-9"
                  placeholder="prenom.nom@onee.ma"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Mot de passe
                </Label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Accès réservé aux agents ONEE. Problème d'accès ? Contactez le support DTI.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
