import { useLocation } from "wouter";
import { Shield, ArrowLeft, Lock, Eye, FileText, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function PublicPrivacyPolicy() {
  const [, setLocation] = useLocation();
  const lastUpdated = "December 2025";
  const companyName = "Care Compliance Management System";
  const contactEmail = "privacy@ccms.co.uk";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/login")}>
            <Shield className="h-7 w-7 text-[#1F7AE0]" />
            <span className="text-xl font-semibold text-gray-900">CCMS</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1F7AE0]" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-gray-600">
            <p>
              {companyName} ("we", "our", or "us") is committed to protecting and respecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our care compliance management platform.
            </p>
            <p>
              We are registered as a Data Controller with the Information Commissioner's Office (ICO) 
              and comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
            <p className="mt-4">
              <strong>Data Controller:</strong> {companyName}<br />
              <strong>Contact:</strong> {contactEmail}
            </p>
          </CardContent>
        </Card>

        {/* Data We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1F7AE0]" />
              Information We Collect
            </CardTitle>
            <CardDescription>Types of personal data we process</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="account">
                <AccordionTrigger>Account Information</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                    <li>Name and email address</li>
                    <li>Job title and role within your organisation</li>
                    <li>Organisation/company name and address</li>
                    <li>Login credentials (passwords are encrypted)</li>
                    <li>Two-factor authentication settings</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="service-users">
                <AccordionTrigger>Service User Data</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                    <li>Names and dates of birth</li>
                    <li>Care package information</li>
                    <li>Support needs and care requirements</li>
                    <li>Compliance assessment records</li>
                    <li>Incident reports and safeguarding records</li>
                  </ul>
                  <p className="mt-2 text-sm text-gray-500">
                    <strong>Note:</strong> Service user data is processed on behalf of your organisation 
                    (the Data Controller). We act as a Data Processor for this information.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="staff">
                <AccordionTrigger>Staff Member Data</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                    <li>Names and job roles</li>
                    <li>Employment dates</li>
                    <li>DBS certificate information</li>
                    <li>Training and compliance records</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="technical">
                <AccordionTrigger>Technical Data</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                    <li>IP addresses and browser information</li>
                    <li>Device type and operating system</li>
                    <li>Usage logs and access timestamps</li>
                    <li>Session cookies and authentication tokens</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* How We Use Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#1F7AE0]" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-gray-900">Lawful Bases for Processing</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <p className="font-medium text-sm text-gray-900">Contract Performance</p>
                  <p className="text-xs text-gray-500">
                    To provide the compliance management services you have subscribed to
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <p className="font-medium text-sm text-gray-900">Legitimate Interests</p>
                  <p className="text-xs text-gray-500">
                    To improve our services, ensure security, and prevent fraud
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <p className="font-medium text-sm text-gray-900">Legal Obligation</p>
                  <p className="text-xs text-gray-500">
                    To comply with regulatory requirements and legal obligations
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <p className="font-medium text-sm text-gray-900">Consent</p>
                  <p className="text-xs text-gray-500">
                    For optional features like marketing communications
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#1F7AE0]" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            <p className="mb-4">
              We implement appropriate technical and organisational measures to protect your personal data 
              against unauthorised access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Strict access controls and authentication</li>
              <li>Regular backups and disaster recovery procedures</li>
              <li>Staff training on data protection</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1F7AE0]" />
              Data Sharing & Third Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              We do not sell your personal data. We may share data with the following categories of recipients:
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Cloud Infrastructure Providers</p>
                <p className="text-xs text-gray-500">
                  Our platform is hosted on secure cloud infrastructure. All data is encrypted at rest and in transit.
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Payment Processors</p>
                <p className="text-xs text-gray-500">
                  Subscription payments are processed by Stripe. We do not store full card details.
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Legal & Regulatory Bodies</p>
                <p className="text-xs text-gray-500">
                  We may disclose data if required by law, court order, or regulatory authority.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#1F7AE0]" />
              Data Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border">
                <div>
                  <p className="font-medium text-sm text-gray-900">Account Data</p>
                  <p className="text-xs text-gray-500">User profiles and login information</p>
                </div>
                <span className="text-sm text-gray-600">Duration of subscription + 2 years</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border">
                <div>
                  <p className="font-medium text-sm text-gray-900">Compliance Records</p>
                  <p className="text-xs text-gray-500">Assessments, audits, and reports</p>
                </div>
                <span className="text-sm text-gray-600">7 years (regulatory requirement)</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border">
                <div>
                  <p className="font-medium text-sm text-gray-900">Technical Logs</p>
                  <p className="text-xs text-gray-500">Access logs and security records</p>
                </div>
                <span className="text-sm text-gray-600">12 months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1F7AE0]" />
              Your Rights Under UK GDPR
            </CardTitle>
            <CardDescription>You have the following rights regarding your personal data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Right of Access</p>
                <p className="text-xs text-gray-500">Request a copy of all personal data we hold about you</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Right to Rectification</p>
                <p className="text-xs text-gray-500">Request correction of inaccurate or incomplete data</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Right to Erasure</p>
                <p className="text-xs text-gray-500">Request deletion of your personal data</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Right to Restrict Processing</p>
                <p className="text-xs text-gray-500">Request limitation of how we use your data</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Right to Data Portability</p>
                <p className="text-xs text-gray-500">Receive your data in a portable format</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm text-gray-900">Right to Object</p>
                <p className="text-xs text-gray-500">Object to certain types of processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700"><strong>Email:</strong> {contactEmail}</p>
              <p className="text-sm text-gray-700"><strong>Company:</strong> UK Health Kits LTD</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-sm pt-4">
          <button onClick={() => setLocation("/terms")} className="text-[#1F7AE0] hover:underline">
            Terms of Service
          </button>
          <button onClick={() => setLocation("/help")} className="text-[#1F7AE0] hover:underline">
            Help Centre
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} CCMS. Built by <a href="https://lampstand.consulting" target="_blank" rel="noopener noreferrer" className="hover:text-[#1F7AE0] transition-colors">Lampstand Consulting</a>.</p>
      </footer>
    </div>
  );
}
