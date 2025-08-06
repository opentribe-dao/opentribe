'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authClient } from '@packages/auth/client';
import { Card, CardContent, CardHeader, CardTitle } from '@packages/base';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const result = await authClient.emailVerification.verify({
          token,
        });

        if (result.error) {
          setStatus('error');
          setMessage(result.error.message || 'Email verification failed');
        } else {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during verification');
        console.error('Email verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 py-8">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-[#E6007A]" />
              <p className="text-center text-white/60">Verifying your email address...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-center text-white">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center text-white">{message}</p>
              <button
                onClick={() => router.push('/sign-in')}
                className="mt-4 rounded-lg bg-[#E6007A] px-6 py-2 text-white hover:bg-[#E6007A]/90"
              >
                Back to Sign In
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}