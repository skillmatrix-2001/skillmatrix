import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login page for unauthenticated users
  // In a real app, you might check authentication first
  redirect('/login');
}

// Optional: If you want to show a loading state
export function generateMetadata() {
  return {
    title: 'SkillMatrix - Redirecting...',
  };
}