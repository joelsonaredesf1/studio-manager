import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Studio Werner", description: "Gestão para estúdio de fotografia — Planner, Clientes, Financeiro, WhatsApp, Produção, Contratos e Relatórios." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="pt-BR"><body>{children}</body></html>);
}
