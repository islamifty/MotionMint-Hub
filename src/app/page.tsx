// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Middleware already handles logged-in users, 
  // but for safety we redirect everyone to /login
  redirect('/login');
}
