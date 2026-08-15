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
          success: { iconTheme: { primary: "#E8342B", secondary: "#0A0A0C" } },
          error: { iconTheme: { primary: "#FF7A45", secondary: "#0A0A0C" } }
        }}
      />
    </SessionProvider>
  );
}
