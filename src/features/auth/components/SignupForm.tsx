"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputField } from "@/components/ui/input-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signupSchema } from "@/features/auth/validations/auth.schema";
import { clientLogger } from "@/lib/client-logger";

type SignupPayload = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<SignupPayload>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupPayload) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      clientLogger.info("Attempting signup", { email: data.email, username: data.username });

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Signup failed");
      }

      // API returns { success: true, data: { user }, message: "..." }
      clientLogger.success("Signup successful", { user: result.data.user });
      setSuccess(result.message || "Account created successfully! Redirecting...");

      // Reset form
      form.reset();

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      clientLogger.error("Signup failed", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <InputField
                control={form.control}
                name="username"
                label="Username"
                placeholder="johndoe"
                autoComplete="username"
              />
              <p className="text-xs text-gray-500">
                3-30 characters, letters, numbers, and underscores only
              </p>
            </div>

            <InputField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="john@example.com"
              autoComplete="email"
            />

            <div className="space-y-2">
              <InputField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500">
                Minimum 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
