'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function CommunicationConsentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    emailConsent: false,
    smsConsent: false,
    hasAgreedToTerms: false,
  });

  // Get a timestamp for consent
  const getConsentTimestamp = () => {
    return new Date().toISOString();
  };

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.emailConsent && !formData.smsConsent) {
        throw new Error('Please select at least one communication method.');
      }

      // Record the consent with timestamp
      const consentRecord = {
        ...formData,
        timestamp: getConsentTimestamp(),
        termsVersion: "v1.0"
      };
      
      console.log('Consent record:', consentRecord);
      
      // Here you would normally save this to your database
      // await userService.saveConsent(consentRecord);
      
      toast({
        title: "Communication preferences saved!",
        description: "Thank you for your consent.",
      });
      
      // Redirect or continue with flow
      // router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Error saving consent:', error);
      toast({
        title: "Failed to save preferences",
        description: error.message || '',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>
                Choose how you&apos;d like to receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Communication Options</h3>
                  <p className="text-sm text-muted-foreground">
                  Receive notifications when your schedule is updated or when you are assigned to a new shift, as well as important announcements and individual coordination messages from dispatchers. You may receive approximately 2-10 messages per week.
                  </p>
                  <div className="space-y-3">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Updates</Label>
                        <p className="text-sm text-muted-foreground">
                            By enabling email updates, you consent to receive notifications at the email address provided.
                        </p>
                      </div>
                      <Switch
                        name="emailConsent"
                        checked={formData.emailConsent}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, emailConsent: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">SMS Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Message and data rates may apply. Reply STOP to unsubscribe at any time.
                        </p>
                      </div>
                      <Switch
                        name="smsConsent"
                        checked={formData.smsConsent}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, smsConsent: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Checkbox
                    id="hasAgreedToTerms"
                    name="hasAgreedToTerms"
                    checked={formData.hasAgreedToTerms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, hasAgreedToTerms: checked as boolean }))
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="hasAgreedToTerms">
                      I consent to receive communications as selected above from NAU Shuttle Services.
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you acknowledge that you have read and agree to our{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>.
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Communication Preferences'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-gray-500 border-t p-4">
              You can update your communication preferences at any time from your account settings.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}