'use client';

import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TermsOfServicePage() {
  const router = useRouter();
  
  return (
    <AppSidebar>
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
              <CardDescription>
                Last updated: April 2, 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">1. Introduction</h2>
                <p>
                  Welcome to NAU Shuttle Services. These Terms of Service govern your use of our website.
                </p>
                <p>
                  By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">2. Communications</h2>
                <p>
                  By creating an Account on our Service, you agree to receive communications related to shift scheduling, including but not limited to shift assignments, schedule changes, shift reminders, and other operational communications essential to your employment. These communications are necessary for the proper functioning of the scheduling service.
                </p>
                <p>
                  We may send these communications via email and/or SMS text messages. For SMS communications, standard message and data rates may apply. While these communications are operational in nature, you can opt out of SMS messages at any time by replying STOP to any message you receive from us. Please note that opting out of communications may affect your ability to receive timely updates about your work schedule.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">3. Content</h2>
                <p>
                  Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for the content that you post to the Service, including its legality, reliability, and appropriateness.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">4. Accounts</h2>
                <p>
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
                <p>
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">5. Service Changes and Termination</h2>
                <p>
                  We reserve the right to withdraw or amend our Service, and any service or material we provide via the Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Service is unavailable at any time or for any period.
                </p>
                <p>
                  We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
                <p>
                  In no event shall NAU Shuttle Services, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">7. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">8. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at shuttle@nau.edu.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}