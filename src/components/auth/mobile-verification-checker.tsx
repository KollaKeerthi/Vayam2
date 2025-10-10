"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function MobileVerificationChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const checkMobileVerification = async () => {
      // Skip check if not authenticated, already on mobile-auth page, or on auth pages
      if (status === "loading" || !session || 
          pathname === "/mobile-auth" || 
          pathname.startsWith("/signin") || 
          pathname.startsWith("/signup")) {
        setIsChecking(false);
        setShouldRender(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/check-mobile-status');
        const data = await response.json();
        
        if (data.needsMobileVerification) {
          toast.info("Please verify your mobile number to continue");
          router.push("/mobile-auth");
          return;
        }
        
        setShouldRender(true);
      } catch (error) {
        console.error("Mobile verification check failed:", error);
        // If check fails, allow access anyway
        setShouldRender(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkMobileVerification();
  }, [session, status, router, pathname]);

  if (isChecking || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}