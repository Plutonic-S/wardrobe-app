'use client';

import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <Card className="p-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-6">
              By accessing and using Digital Wardrobe, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
            <p className="text-muted-foreground mb-6">
              You agree to use Digital Wardrobe only for lawful purposes and in accordance with these Terms.
              You agree not to use the service in any way that could damage, disable, or impair the service.
            </p>

            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-6">
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold mb-4">4. Content</h2>
            <p className="text-muted-foreground mb-6">
              You retain all rights to the content you upload to Digital Wardrobe. By uploading content,
              you grant us a license to use, store, and display your content as necessary to provide the service.
            </p>

            <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
            <p className="text-muted-foreground mb-6">
              We may terminate or suspend your account and access to the service immediately, without prior notice,
              for any reason, including breach of these Terms.
            </p>

            <h2 className="text-2xl font-semibold mb-4">6. Changes to Terms</h2>
            <p className="text-muted-foreground mb-6">
              We reserve the right to modify these terms at any time. We will notify you of any changes
              by posting the new Terms of Service on this page.
            </p>

            <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at support@digitalwardrobe.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
