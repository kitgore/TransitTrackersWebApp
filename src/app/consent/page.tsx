'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

// Mock data - in a real app, you would fetch this from your database
const consentRecords = [
  {
    id: '1',
    name: 'Benjamin Griepp',
    phone: '623-***-5932',
    email: 'bengriepp@gmail.com',
    consentDate: '2025-04-02T14:32:45Z',
    consentType: ['SMS', 'Email'],
    termsVersion: 'v1.0'
  },
  {
    id: '2',
    name: 'Lauren Bushman',
    phone: '928-***-2716',
    email: 'lkf57@nau.edu',
    consentDate: '2025-04-02T09:15:22Z',
    consentType: ['SMS', 'Email'],
    termsVersion: 'v1.0'
  }
];

export default function ProofOfConsentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filteredRecords, setFilteredRecords] = useState(consentRecords);

  // Function to censor phone numbers
  const censorPhone = (phone: string) => {
    // Keep the area code and last 4 digits, replace middle with asterisks
    return phone.replace(/(\d{3})-(\d{3})-(\d{4})/, '$1-***-$3');
  };

  // Function to censor email addresses
  const censorEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (username.length <= 1) return email;
    
    // Keep first character, replace rest with asterisks
    const censoredUsername = username.charAt(0) + '*'.repeat(username.length - 1);
    return `${censoredUsername}@${domain}`;
  };

  useEffect(() => {
    // Filter records based on search input
    const results = consentRecords.filter(record => 
      record.name.toLowerCase().includes(search.toLowerCase()) ||
      record.email.toLowerCase().includes(search.toLowerCase()) ||
      record.phone.includes(search)
    );
    setFilteredRecords(results);
  }, [search]);

  const handleDownloadCSV = () => {
    // Simple CSV generation
    const headers = ['Name', 'Phone', 'Email', 'Consent Date', 'Consent Type', 'Terms Version'];
    const csvData = filteredRecords.map(record => [
      record.name,
      censorPhone(record.phone),
      censorEmail(record.email),
      record.consentDate,
      record.consentType.join(', '),
      record.termsVersion
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'consent_records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: "Consent records have been downloaded as CSV."
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proof of Consent Records</CardTitle>
              <CardDescription>
                This page demonstrates consent collection for messaging services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">Consent Collection Form Screenshot</h3>
                  <div className="border border-dashed rounded-lg p-4 flex items-center justify-center bg-gray-50 h-auto max-h-[500px] overflow-hidden">
                    {/* Replace with your actual screenshot */}
                    <div className="text-center w-full max-w-md">
                      <p className="text-sm text-gray-500 mb-2">Screenshot of consent form as shown to users</p>
                      <Image 
                        src="/userConsent.png" 
                        alt="Communication Preferences Form"
                        width={400}
                        height={450}
                        className="mx-auto object-contain w-full h-auto"
                        priority
                        // This is a fallback if the image doesn't exist
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden">
                        <p className="text-gray-400">Screenshot image would appear here</p>
                        <p className="text-xs text-gray-400 mt-2">
                          (Shows the communication options with clear opt-in language and checkbox)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search records..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleDownloadCSV} className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                <Table>
                  <TableCaption>A list of users who have provided consent for communications.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Consent Date</TableHead>
                      <TableHead>Consent Type</TableHead>
                      <TableHead>Terms Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{censorPhone(record.phone)}</TableCell>
                        <TableCell>{censorEmail(record.email)}</TableCell>
                        <TableCell>{formatDate(record.consentDate)}</TableCell>
                        <TableCell>{record.consentType.join(', ')}</TableCell>
                        <TableCell>{record.termsVersion}</TableCell>
                      </TableRow>
                    ))}
                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No matching records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}