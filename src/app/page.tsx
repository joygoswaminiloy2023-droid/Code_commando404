"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowRight, Terminal, FolderKanban, Users2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error.includes("blocked") ? res.error : "Wrong email or password.");
      return;
    }
    toast.success("Signed in.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink relative overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "linear-gradient(#EAF0F6 1px, transparent 1px), linear-gradient(90deg, #EAF0F6 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />
      <motion.div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-signal/10 blur-[120px]"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#7C9CF5]/10 blur-[110px]"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="flex items-center gap-2 text-signal mb-8"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center">
              <Terminal size={16} />
            </div>
            <span className="font-mono text-xs tracking-[0.2em] uppercase">Code Commando 404</span>
          </motion.div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-medium text-paper leading-[0.95] tracking-tight">
            Run every
            <br />
            project.
            <br />
            <span className="text-signal">In real time.</span>
          </h1>
          <p className="text-mute text-base sm:text-lg mt-6 max-w-md leading-relaxed">
            Spin up projects, build teams and groups, hand off files and tasks,
            and watch progress land the instant it happens.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-10 font-mono text-xs text-mute">
            {[
              { icon: FolderKanban, label: "Multi-project" },
              { icon: Users2, label: "Team & groups" },
              { icon: ShieldCheck, label: "Admin control" }
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
              >
                <item.icon size={20} className="text-paper mb-2" />
                {item.label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="bg-panel border border-line rounded-xl2 p-8 shadow-glow"
        >
          <h2 className="font-display text-2xl text-paper mb-1">Sign in</h2>
          <p className="text-mute text-sm mb-6">Use the account your admin set up for you.</p>

          <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-4 py-3 text-paper mb-4 focus-ring outline-none"
            placeholder="you@team.com"
          />

          <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink border border-line rounded-lg px-4 py-3 text-paper mb-6 focus-ring outline-none"
            placeholder="••••••••"
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-signal text-ink font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Enter workspace"}
            <ArrowRight size={16} />
          </motion.button>

          <p className="text-mute text-xs mt-6 text-center">
            First time setting this up?{" "}
            <Link href="/setup" className="text-signal hover:underline">Create the admin account</Link>
          </p>
        </motion.form>
      </div>
    </main>
  );
}
