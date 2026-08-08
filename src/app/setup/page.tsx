"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { Terminal } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, title: "Workspace Admin" })
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not create account.");
      return;
    }
    if (data.role !== "admin") {
      toast.error("An admin already exists — go sign in instead.");
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    toast.success("Workspace created.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "linear-gradient(#EAF0F6 1px, transparent 1px), linear-gradient(90deg, #EAF0F6 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />
      <motion.div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-signal/10 blur-[120px]"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-panel border border-line rounded-xl2 p-8 shadow-glow"
      >
        <div className="flex items-center gap-2 text-signal mb-6">
          <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center">
            <Terminal size={16} />
          </div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase">Code Commando 404</span>
        </div>
        <h1 className="font-display text-3xl text-paper mb-1">Set up your workspace</h1>
        <p className="text-mute text-sm mb-6">This creates the one admin account. Works only once.</p>

        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Your name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-ink border border-line rounded-lg px-4 py-3 text-paper mb-4 focus-ring outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-ink border border-line rounded-lg px-4 py-3 text-paper mb-4 focus-ring outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-ink border border-line rounded-lg px-4 py-3 text-paper mb-6 focus-ring outline-none"
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full bg-signal text-ink font-medium rounded-lg py-3 hover:bg-signal2 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create admin account"}
        </motion.button>

        <p className="text-mute text-xs mt-6 text-center">
          Already set up? <Link href="/" className="text-signal hover:underline">Sign in</Link>
        </p>
      </motion.form>
    </main>
  );
}
