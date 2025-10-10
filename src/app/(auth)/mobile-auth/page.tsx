import { MobileOtpAuth } from "@/components/auth/mobile-otp-auth";
import { Toaster } from "sonner";

export default function MobileAuthPage() {
  return (
    <>
      <MobileOtpAuth />
      <Toaster />
    </>
  );
}