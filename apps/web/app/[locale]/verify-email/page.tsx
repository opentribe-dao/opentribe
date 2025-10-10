'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authClient } from '@packages/auth/client';
import { Card, CardContent, CardHeader, CardTitle } from '@packages/base/components/ui/card';
import { Loader2, CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@packages/base/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'| 'unverified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');


      if(!token) {
        setStatus('unverified');
        setMessage('We have just sent you an email to verify your account. Please check your inbox.');
        return;
      }
      
      if (token?.length === 0) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const result = await authClient.verifyEmail({
          query: {
            token,
          },
        });

        if (result.error) {
          setStatus('error');
          setMessage(result.error.message || 'Email verification failed');
        } else {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/onboarding');
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
    
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className='mb-8 bg-gradient-to-r from-white/35 to-white bg-clip-text text-center font-bold font-heading text-transparent text-xl tracking-[0.25em]'>
            OPENTRIBE
      </div>
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

          {status === 'unverified' && (
            <>
              <Mail className="h-12 w-12 text-[#E6007A]" />
              <p className="text-center text-white">{message}</p>
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
              <Button
                onClick={() => router.push('/sign-in')}
                variant="default"
                size="lg"
              >
                Back to Sign In
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}