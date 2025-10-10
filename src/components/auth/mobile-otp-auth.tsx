"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, Phone, Shield } from "lucide-react";

export const MobileOtpAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [userMobileStatus, setUserMobileStatus] = useState<{
    hasMobile: boolean;
    existingMobile?: string;
    isVerified: boolean;
  } | null>(null);

  const auth = getAuth(app);
  const router = useRouter();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaInitialized = useRef<boolean>(false);

  // Check user's current mobile status
  useEffect(() => {
    const checkMobileStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-mobile-status');
        const data = await response.json();
        
        setUserMobileStatus({
          hasMobile: data.hasMobile,
          existingMobile: data.existingMobile,
          isVerified: data.isMobileVerified,
        });

        // If user has mobile but it's not verified, pre-fill the number
        if (data.hasMobile && data.existingMobile && !data.isMobileVerified) {
          const mobile = data.existingMobile.replace('+91', '');
          setPhoneNumber(mobile);
        }
      } catch (error) {
        console.error("Failed to check mobile status:", error);
      }
    };

    checkMobileStatus();
  }, []);

  // Initialize reCAPTCHA with better error handling
  const initializeRecaptcha = () => {
    if (!recaptchaInitialized.current) {
      try {
        // Clear any existing recaptcha container
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response: string) => {
              console.log("reCAPTCHA solved:", response);
            },
            "expired-callback": () => {
              toast.error("Security verification expired. Please try again.");
              resetRecaptcha();
            },
            "error-callback": (error: Error) => {
              console.error("reCAPTCHA error:", error);
              toast.error(
                "Security verification failed. Please refresh and try again."
              );
              resetRecaptcha();
            },
          }
        );

        // Render the reCAPTCHA
        recaptchaVerifierRef.current
          .render()
          .then(() => {
            console.log("reCAPTCHA rendered successfully");
            recaptchaInitialized.current = true;
          })
          .catch((error) => {
            console.error("reCAPTCHA render error:", error);
            toast.error(
              "Failed to initialize security verification. Please refresh the page."
            );
          });
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
        toast.error(
          "Failed to initialize security verification. Please refresh the page."
        );
      }
    }
  };

  // Reset reCAPTCHA
  const resetRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (error) {
        console.error("Error clearing reCAPTCHA:", error);
      }
      recaptchaVerifierRef.current = null;
    }
    recaptchaInitialized.current = false;
  };

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    const timer = setTimeout(() => {
      initializeRecaptcha();
    }, 100);

    return () => {
      clearTimeout(timer);
      resetRecaptcha();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    return `+91${cleaned}`;
  };

  const handleSkip = async () => {
    try {
      const response = await fetch('/api/auth/skip-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success("Mobile verification skipped. You can add it later from settings.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to skip mobile verification. Please try again.");
      }
    } catch (error) {
      console.error("Skip mobile error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error(
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
      );
      return;
    }

    setLoading(true);

    try {
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Check if mobile already exists (only if it's not the user's current mobile)
      if (!userMobileStatus?.hasMobile || userMobileStatus.existingMobile !== formattedPhoneNumber) {
        const existsRes = await fetch("/api/auth/mobile-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: formattedPhoneNumber }),
        });
        const existsData = await existsRes.json();
        if (existsData.exists) {
          toast.error(
            "This mobile number is already registered. Please use a different number or sign in."
          );
          setLoading(false);
          return;
        }
      }

      // Ensure reCAPTCHA is initialized
      if (!recaptchaVerifierRef.current || !recaptchaInitialized.current) {
        resetRecaptcha();
        initializeRecaptcha();

        // Wait a bit for initialization
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!recaptchaVerifierRef.current) {
          throw new Error("Failed to initialize security verification");
        }
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(60);
      toast.success("OTP sent successfully!");
    } catch (error: unknown) {
      console.error("Send OTP error:", error);

      let errorMessage = "Failed to send OTP. Please try again.";

      if (typeof error === 'object' && error && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/invalid-phone-number":
            errorMessage = "Invalid phone number format.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later.";
            break;
          case "auth/captcha-check-failed":
            errorMessage =
              "Security verification failed. Please refresh and try again.";
            resetRecaptcha();
            break;
          case "auth/invalid-app-credential":
            errorMessage = "App configuration error. Please contact support.";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error. Please check your internet connection.";
            break;
          case "auth/quota-exceeded":
            errorMessage = "Daily SMS limit exceeded. Please try again tomorrow.";
            break;
          default:
            if (firebaseError.message?.includes("reCAPTCHA")) {
              errorMessage =
                "Security verification failed. Please refresh and try again.";
              resetRecaptcha();
            }
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (!confirmationResult) {
      toast.error("Please request OTP first");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      await confirmationResult.confirm(otp);

      // Update mobile in DB
      const response = await fetch("/api/auth/update-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: formatPhoneNumber(phoneNumber) }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update mobile number");
      }

      toast.success("Phone number verified successfully!");
      // Reset form
      setOtp("");
      setOtpSent(false);
      setConfirmationResult(null);
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("OTP verification error:", error);

      let errorMessage = "Invalid OTP. Please try again.";

      if (typeof error === 'object' && error && 'code' in error) {
        const firebaseError = error as { code: string };
        switch (firebaseError.code) {
          case "auth/invalid-verification-code":
            errorMessage =
              "Invalid verification code. Please check and try again.";
            break;
          case "auth/code-expired":
            errorMessage =
              "Verification code has expired. Please request a new one.";
            break;
          case "auth/session-expired":
            errorMessage = "Session expired. Please request a new OTP.";
            setOtpSent(false);
            setConfirmationResult(null);
            break;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setOtp("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    // Reset state
    setOtpSent(false);
    setConfirmationResult(null);
    setOtp("");
    // Reset and reinitialize reCAPTCHA for resend
    resetRecaptcha();
    setTimeout(() => {
      initializeRecaptcha();
      setTimeout(() => {
        handleSendOtp();
      }, 500);
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpSent) {
      handleOTPSubmit();
    } else {
      handleSendOtp();
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setConfirmationResult(null);
    setOtp("");
    setResendTimer(0);
    resetRecaptcha();
    setTimeout(initializeRecaptcha, 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative">
      {/* Clean, minimal background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-background pointer-events-none"></div>

      {/* Compact header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6 relative z-10"
      >
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          {userMobileStatus?.hasMobile && !userMobileStatus.isVerified 
            ? "Verify Your Mobile Number" 
            : "Add Your Mobile Number"
          }
        </h1>
        <p className="text-sm text-muted-foreground">
          {userMobileStatus?.hasMobile && !userMobileStatus.isVerified 
            ? "Complete your account security" 
            : "Stay connected and secure your account"
          }
        </p>
      </motion.div>

      {/* Professional card with clean design */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border shadow-sm bg-card">
          <CardHeader className="space-y-3 pb-4">
            {/* Simple, clean icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary/10 rounded-full">
              {otpSent ? (
                <Shield className="w-5 h-5 text-primary" />
              ) : (
                <Phone className="w-5 h-5 text-primary" />
              )}
            </div>

            <div className="text-center space-y-1">
              <CardTitle className="text-lg font-semibold">
                {otpSent ? "Enter Verification Code" : "Enter Mobile Number"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {otpSent
                  ? `Code sent to ${formatPhoneNumber(phoneNumber)}`
                  : "We'll send you a verification code"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Mobile Number
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md text-sm text-muted-foreground">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        disabled={loading}
                        className="rounded-l-none border-l-0 h-10"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a valid 10-digit mobile number
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={
                      loading ||
                      phoneNumber.length !== 10 ||
                      !validatePhoneNumber(phoneNumber)
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Verification Code
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={otpLoading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="w-10 h-10" />
                          <InputOTPSlot index={1} className="w-10 h-10" />
                          <InputOTPSlot index={2} className="w-10 h-10" />
                          <InputOTPSlot index={3} className="w-10 h-10" />
                          <InputOTPSlot index={4} className="w-10 h-10" />
                          <InputOTPSlot index={5} className="w-10 h-10" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={otpLoading || otp.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <div className="flex flex-col space-y-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                      className="text-xs h-8"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBackToPhone}
                      className="text-xs h-8"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Change Number
                    </Button>
                  </div>
                </>
              )}
            </form>
            
            {/* Hidden reCAPTCHA */}
            <div id="recaptcha-container" className="hidden"></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clean skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        onClick={handleSkip}
        type="button"
      >
        Skip for now
      </motion.button>
    </div>
  );
};

export default MobileOtpAuth;