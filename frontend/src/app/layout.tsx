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
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
