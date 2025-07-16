import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import AdminProfileModal from './AdminProfileModal';

function getInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileAvatar() {
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchName = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const res = await api.get('/admin/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminName(res.data.name || '');
      } catch {
        setAdminName('');
      } finally {
        setLoading(false);
      }
    };
    fetchName();
  }, []);

  const initials = getInitials(adminName || 'A');

  return (
    <>
      <button
        className="ml-2 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow hover:scale-105 transition-transform cursor-pointer border-2 border-white focus:outline-none"
        onClick={() => setModalOpen(true)}
        aria-label="View Profile"
        type="button"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : initials}
      </button>
      <AdminProfileModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
} 