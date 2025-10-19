import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Digital Wardrobe",
  description: "Login or sign up to access your digital wardrobe",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
