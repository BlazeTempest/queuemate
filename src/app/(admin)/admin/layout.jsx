import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin Panel | QueueMate',
  description: 'QueueMate administration dashboard',
};

export default async function AdminLayout({ children }) {
  const auth = await getAuthUser();

  // If not logged in, redirect to home
  if (!auth) {
    redirect('/');
  }

  // If not an admin, redirect to dashboard
  if (auth.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Serialize user data for the client component
  const userData = {
    id: auth.user.id,
    username: auth.user.username,
    avatar: auth.user.avatar,
    role: auth.user.role,
  };

  return <AdminShell user={userData}>{children}</AdminShell>;
}
