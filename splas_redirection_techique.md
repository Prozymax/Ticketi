```bash`
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');

    if (!hasVisited && !session) {
      localStorage.setItem('hasVisited', 'true');
      router.push('/splash');
    }
  }, [session]);

  return (
    <main>
      {/* Your dashboard or homepage */}
    </main>
  );
}