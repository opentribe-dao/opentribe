"use client";

import { useSession } from "@packages/auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { env } from "@/env";

const ProfileRedirectPage = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      if (!isPending && session?.user) {
        try {
          // Fetch user data to get username
          const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            const username = data.user.username || session.user.id;
            router.push(`/profile/${username}`);
          } else {
            router.push(`/profile/${session.user.id}`);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          router.push(`/profile/${session.user.id}`);
        }
      } else if (!isPending && !session?.user) {
        // Not logged in, redirect to home
        router.push("/");
      }
    };

    fetchUserAndRedirect();
  }, [session, isPending, router]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
    </div>
  );
};

export default ProfileRedirectPage;