"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function AddMemberModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", title: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not add member.");
      return;
    }
    toast.success(`${form.name} added to the team.`);
    setForm({ name: "", email: "", password: "", title: "" });
    onCreated();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-panel border border-line rounded-xl2 p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-paper">Add team member</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>
            {["name", "email", "title", "password"].map((field) => (
              <div key={field} className="mb-4">
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
                  {field === "title" ? "Role / title" : field}
                </label>
                <input
                  required={field !== "title"}
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  value={(form as any)[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={field === "title" ? "Frontend Developer" : ""}
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper text-sm focus-ring outline-none"
                />
              </div>
            ))}
            <button
              disabled={submitting}
              className="w-full bg-signal text-ink font-medium rounded-lg py-2.5 hover:bg-signal2 transition-colors disabled:opacity-60 text-sm"
            >
              {submitting ? "Adding..." : "Add member"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
