'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/utils/supabase';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to SplitEase</h1>
      <p className="text-center text-gray-600 mb-8 max-w-md mx-auto">
        Split restaurant bills effortlessly with friends and keep track of who owes what.
      </p>

      <AuthForm />
    </div>
  );
} 