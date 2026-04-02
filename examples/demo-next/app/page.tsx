import { redirect } from 'next/navigation';

// Root redirects to the docs landing page
export default function Home() {
    redirect('/docs');
}
