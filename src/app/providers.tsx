"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#161E29",
            color: "#EAF0F6",
            border: "1px solid #232D3A",
            fontFamily: "var(--font-body)",
            fontSize: "14px"
          },
          success: { iconTheme: { primary: "#5EF1C0", secondary: "#0B0F14" } },
          error: { iconTheme: { primary: "#F26B6B", secondary: "#0B0F14" } }
        }}
      />
    </SessionProvider>
  );
}
