'use client';

import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <Card className="p-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-6">
              We collect information that you provide directly to us, including when you create an account,
              add items to your wardrobe, create outfits, or contact our support team.
            </p>

            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-6">
              We use the information we collect to provide, maintain, and improve our services,
              to communicate with you, and to personalize your experience.
            </p>

            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties
              without your consent, except as described in this policy.
            </p>

            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground mb-6">
              We implement appropriate security measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-muted-foreground mb-6">
              You have the right to access, update, or delete your personal information at any time.
              You can do this through your account settings or by contacting us.
            </p>

            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at privacy@digitalwardrobe.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
