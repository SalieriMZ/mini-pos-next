import { redirect } from 'next/navigation';

// Página raíz: redirige automáticamente al dashboard
export default function HomePage() {
  redirect('/dashboard');
}
