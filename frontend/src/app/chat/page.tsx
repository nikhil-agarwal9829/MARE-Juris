import { redirect } from 'next/navigation';

export default function ChatRedirectPage({
  searchParams,
}: {
  searchParams?: { q?: string; chat?: string };
}) {
  const queryStr = searchParams?.q ? `?q=${encodeURIComponent(searchParams.q)}` : searchParams?.chat ? `?chat=${encodeURIComponent(searchParams.chat)}` : '';
  redirect(`/ask-juris${queryStr}`);
}
