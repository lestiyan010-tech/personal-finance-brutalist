"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "");

    if (mode === "register") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        setError("Gagal daftar. Cek email/password.");
        return;
      }
    }

    const login = await signIn("credentials", { email, password, redirect: false });
    if ((login as { error?: string } | undefined)?.error) {
      setError("Login gagal.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-brut-bg text-brut-fg p-6 md:p-10">
      <div className="mx-auto max-w-2xl brutal-box">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">BrutalBudget</h1>
        <p className="mt-2 font-semibold">Pencatat keuangan personal — Next.js + PostgreSQL + AI-ready.</p>

        <div className="mt-6 flex gap-3">
          <button className={`brut-btn ${mode === "login" ? "bg-brut-yellow" : "bg-white"}`} onClick={() => setMode("login")}>Login</button>
          <button className={`brut-btn ${mode === "register" ? "bg-brut-yellow" : "bg-white"}`} onClick={() => setMode("register")}>Daftar</button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          {mode === "register" && <input name="name" placeholder="Nama" className="brut-input" />}
          <input name="email" type="email" required placeholder="Email" className="brut-input" />
          <input name="password" type="password" required placeholder="Password" className="brut-input" />
          <button className="brut-btn bg-brut-yellow" type="submit">{mode === "login" ? "Masuk" : "Daftar & Masuk"}</button>
          {error && <p className="font-bold text-red-600">{error}</p>}
        </form>
      </div>
    </main>
  );
}
