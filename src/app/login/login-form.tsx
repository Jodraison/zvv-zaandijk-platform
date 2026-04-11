"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CLUB_NAME, TEAM_DISPLAY_LABEL } from "@/constants/club";
import { ensureProfileAfterLoginAction, enforceOwnerSessionAfterLoginAction } from "@/actions/auth-profile";

function errorMessageFromKey(key: string | undefined): string | null {
  if (!key) return null;
  if (key === "config") return "Server mist Supabase-configuratie.";
  if (key === "auth") return "Inlogsessie mislukt. Probeer opnieuw.";
  if (key === "not_admin")
    return "Geen beheerdersrechten. Alleen het eigenaar-account kan inloggen.";
  if (key === "no_profile") return "Je account heeft nog geen profiel. Voer migratie 010 uit (profiles_insert_self) of neem contact op met beheer.";
  if (key === "profile_load") return "Profiel kon niet worden geladen. Controleer RLS op `profiles` en of je met de juiste Supabase-keys draait.";
  return `Authenticatieprobleem (${key}).`;
}

export function LoginForm({ serverErrorKey }: { serverErrorKey?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/beheer";
  const urlError = searchParams.get("error");
  const configError = urlError === "config";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    errorMessageFromKey(serverErrorKey) ?? (configError ? errorMessageFromKey("config") : null),
  );

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
      const ensured = await ensureProfileAfterLoginAction();
      if (!ensured.ok) {
        setMessage(ensured.error ?? "Profiel kon niet worden aangemaakt.");
        setBusy(false);
        return;
      }
      const gate = await enforceOwnerSessionAfterLoginAction();
      if (!gate.ok) {
        setMessage(gate.error ?? "Toegang geweigerd.");
        setBusy(false);
        return;
      }
      router.refresh();
      router.push(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Inloggen mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
      setMessage("Controleer je e-mail voor de magic link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Versturen mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-10 text-center">
        <p className="club-page-eyebrow">Beheerderslogin</p>
        <h1 className="mt-2 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-zvv-ink md:text-5xl">{CLUB_NAME}</h1>
        <p className="mt-1 text-sm text-zvv-muted">{TEAM_DISPLAY_LABEL}</p>
      </div>

      <div className="rounded-2xl border border-zvv-border bg-white p-6 shadow-[var(--shadow-zvv-card)]">
        {message ? (
          <p
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              message.includes("Controleer je e-mail") ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </p>
        ) : null}

        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zvv-muted">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full rounded-xl border border-zvv-border bg-white px-4 py-3 text-zvv-ink placeholder:text-zvv-muted/70 focus:border-zvv-primary/50 focus:outline-none focus:ring-2 focus:ring-zvv-primary/15"
              placeholder="naam@voorbeeld.nl"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zvv-muted">
              Wachtwoord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-xl border border-zvv-border bg-white px-4 py-3 text-zvv-ink placeholder:text-zvv-muted/70 focus:border-zvv-primary/50 focus:outline-none focus:ring-2 focus:ring-zvv-primary/15"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="club-btn-primary w-full py-3 text-sm disabled:opacity-50"
          >
            {busy ? "Bezig…" : "Inloggen"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zvv-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider text-zvv-muted">
            <span className="bg-white px-3">of</span>
          </div>
        </div>

        <form onSubmit={onMagicLink} className="space-y-3">
          <p className="text-center text-xs text-zvv-muted">Magic link (zonder wachtwoord)</p>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="w-full rounded-xl border-2 border-zvv-border bg-zvv-card-mid py-3 text-sm font-semibold text-zvv-ink transition hover:border-zvv-primary/30 hover:bg-white disabled:opacity-40"
          >
            Stuur inloglink
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-zvv-muted">
        <Link href="/" className="font-semibold text-zvv-primary hover:text-zvv-primary-hover">
          ← Terug naar het platform
        </Link>
      </p>
    </div>
  );
}
