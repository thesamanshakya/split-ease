'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function VerificationHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if this is a verification redirect
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'signup') {
      setIsVerifying(true);
      
      // Show success message
      toast.success('Email verified successfully! Please log in to continue.', {
        duration: 5000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth');
      }, 1500);
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything visible
}
