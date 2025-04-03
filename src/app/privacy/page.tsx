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

export default function PrivacyPolicyPage() {
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
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>
                Last updated: April 2, 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">1. Introduction</h2>
                <p>
                  NAU Shuttle Services respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and mobile application and tell you about your privacy rights.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">2. Information We Collect</h2>
                <p>
                  We collect several types of information from and about users of our Service, including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Personal identifiers such as name, email address, phone number, and postal address.</li>
                  <li>Account information such as username and password.</li>
                  <li>Usage data such as information on how you use our Service.</li>
                  <li>Device information such as IP address, browser type, and operating system.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
                <p>
                  We use the information we collect about you for various purposes, including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To provide and maintain our Service.</li>
                  <li>To notify you about changes to our Service.</li>
                  <li>To allow you to participate in interactive features of our Service.</li>
                  <li>To provide customer support.</li>
                  <li>To gather analysis or valuable information so that we can improve our Service.</li>
                  <li>To monitor the usage of our Service.</li>
                  <li>To detect, prevent and address technical issues.</li>
                  <li>To send you promotional communications about our products and services, when you have opted in to receive such communications.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">4. Text Message Communications</h2>
                <p>
                  If you provide your mobile phone number and opt in to receive SMS communications, we may send you text messages related to our services. Standard message and data rates may apply. You can opt out of receiving text messages at any time by replying STOP to any message you receive from us or by updating your communication preferences in your account settings.
                </p>
                <p>
                  When you opt in to receive text messages, we collect and store:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your phone number</li>
                  <li>The date and time of your consent</li>
                  <li>The IP address used when providing consent</li>
                  <li>Your communication preferences</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">5. Data Sharing and Disclosure</h2>
                <p>
                  We may share your personal information in the following situations:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>With service providers who perform services for us.</li>
                  <li>To comply with legal obligations.</li>
                  <li>To protect and defend our rights and property.</li>
                  <li>With your consent or at your direction.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">6. Your Data Protection Rights</h2>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, such as:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The right to access, update, or delete your personal information.</li>
                  <li>The right to rectification if your information is inaccurate or incomplete.</li>
                  <li>The right to object to our processing of your personal data.</li>
                  <li>The right to request restriction of processing of your personal data.</li>
                  <li>The right to data portability.</li>
                  <li>The right to withdraw consent.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">7. Data Security</h2>
                <p>
                  We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">8. Changes to This Privacy Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the Last Updated date.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">9. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at shuttle@nau.edu.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}