// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Middleware ইতিমধ্যেই logged-in user কে dashboard এ পাঠাবে
  // এখানে non-logged-in user কে login page এ redirect করা হচ্ছে
  redirect('/login');
}
