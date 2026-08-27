import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MARE-Juris | Evidence-Grounded Indian Legal Intelligence Platform',
  description:
    'Multi-Agent Retrieval-Enhanced Framework for Intelligent Legal Decision Support. Understand Indian law with evidence-grounded information, case law, statutes, and compliance insights.',
  keywords: [
    'LegalTech',
    'Indian Law',
    'Legal Intelligence',
    'Case Law',
    'Statutes',
    'Evidence Grounding',
    'Business Compliance',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased selection:bg-gold-500 selection:text-navy-950">
        {children}
      </body>
    </html>
  );
}
