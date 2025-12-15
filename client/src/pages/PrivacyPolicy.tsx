import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Lock, Eye, FileText, Users, Globe, Mail, Clock } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "15 December 2024";
  const companyName = "Care Compliance Management System";
  const contactEmail = "privacy@carecompliancesystem.co.uk";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              {companyName} ("we", "our", or "us") is committed to protecting and respecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our care compliance management platform.
            </p>
            <p>
              We are registered as a Data Controller with the Information Commissioner's Office (ICO) 
              and comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
            <p>
              <strong>Data Controller:</strong> {companyName}<br />
              <strong>Contact:</strong> {contactEmail}
            </p>
          </CardContent>
        </Card>

        {/* Data We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Information We Collect
            </CardTitle>
            <CardDescription>
              Types of personal data we process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="account">
                <AccordionTrigger>Account Information</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
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
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Names and dates of birth</li>
                    <li>Care package information</li>
                    <li>Support needs and care requirements</li>
                    <li>Compliance assessment records</li>
                    <li>Incident reports and safeguarding records</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong>Note:</strong> Service user data is processed on behalf of your organisation 
                    (the Data Controller). We act as a Data Processor for this information.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="staff">
                <AccordionTrigger>Staff Member Data</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Names and job roles</li>
                    <li>Employment dates</li>
                    <li>DBS certificate information</li>
                    <li>Training and compliance records</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ai-audits">
                <AccordionTrigger>AI Audit Data</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Document text submitted for AI analysis</li>
                    <li>AI-generated feedback and scores</li>
                    <li>Anonymisation reports showing what data was redacted</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong>Important:</strong> When you use AI audit features, documents are automatically 
                    anonymised (names converted to initials, personal identifiers removed) before being 
                    sent to OpenAI for analysis. We do NOT store the original documents - only the 
                    anonymised AI feedback is retained.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="technical">
                <AccordionTrigger>Technical Data</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
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
              <Eye className="h-5 w-5" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Lawful Bases for Processing</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">Contract Performance</p>
                    <p className="text-xs text-muted-foreground">
                      To provide the compliance management services you have subscribed to
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">Legitimate Interests</p>
                    <p className="text-xs text-muted-foreground">
                      To improve our services, ensure security, and prevent fraud
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">Legal Obligation</p>
                    <p className="text-xs text-muted-foreground">
                      To comply with regulatory requirements and legal obligations
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">Consent</p>
                    <p className="text-xs text-muted-foreground">
                      For optional features like marketing communications
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Specific Purposes</h4>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Providing and maintaining the compliance management platform</li>
                  <li>Processing compliance assessments and generating reports</li>
                  <li>Sending audit reminders and notifications</li>
                  <li>Providing AI-powered document analysis (with anonymisation)</li>
                  <li>Customer support and service communications</li>
                  <li>Platform security and fraud prevention</li>
                  <li>Analytics to improve our services</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              AI Processing & Data Protection
            </CardTitle>
            <CardDescription>
              How we protect your data when using AI features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Important: AI Processing Uses Your Own API Key
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                When you use AI audit features, documents are processed using YOUR organisation's 
                OpenAI API key. This means:
              </p>
              <ul className="list-disc pl-4 mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>Data is sent directly to OpenAI under your organisation's agreement with them</li>
                <li>You maintain control over your OpenAI data usage and retention policies</li>
                <li>We do not have access to your OpenAI account or API usage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Anonymisation Process</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Before any document is sent for AI analysis, we automatically:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Convert full names to initials (e.g., "John Smith" → "J.S.")</li>
                <li>Redact phone numbers and email addresses</li>
                <li>Remove NHS numbers and national insurance numbers</li>
                <li>Mask postcodes and specific addresses</li>
                <li>Redact dates of birth</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">What We Store</h4>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li><strong>We DO store:</strong> Anonymised AI feedback, scores, and recommendations</li>
                <li><strong>We DO NOT store:</strong> Original documents or un-anonymised text</li>
                <li><strong>We DO store:</strong> Anonymisation reports (record of what was redacted)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Data Sharing & Third Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              We do not sell your personal data. We may share data with the following categories 
              of recipients:
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Cloud Infrastructure Providers</p>
                <p className="text-xs text-muted-foreground">
                  Our platform is hosted on secure cloud infrastructure. All data is encrypted 
                  at rest and in transit.
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">OpenAI (AI Processing)</p>
                <p className="text-xs text-muted-foreground">
                  When you use AI features, anonymised document text is sent to OpenAI using 
                  your organisation's API key. See OpenAI's privacy policy for their data handling.
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Payment Processors</p>
                <p className="text-xs text-muted-foreground">
                  Subscription payments are processed by Stripe. We do not store full card details.
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Legal & Regulatory Bodies</p>
                <p className="text-xs text-muted-foreground">
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
              <Clock className="h-5 w-5" />
              Data Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Account Data</p>
                  <p className="text-xs text-muted-foreground">User profiles and login information</p>
                </div>
                <span className="text-sm">Duration of subscription + 2 years</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Compliance Records</p>
                  <p className="text-xs text-muted-foreground">Assessments, audits, and reports</p>
                </div>
                <span className="text-sm">7 years (regulatory requirement)</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">AI Audit Feedback</p>
                  <p className="text-xs text-muted-foreground">Anonymised AI analysis results</p>
                </div>
                <span className="text-sm">3 years</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Technical Logs</p>
                  <p className="text-xs text-muted-foreground">Access logs and security records</p>
                </div>
                <span className="text-sm">12 months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Rights Under GDPR
            </CardTitle>
            <CardDescription>
              You have the following rights regarding your personal data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Right of Access</p>
                <p className="text-xs text-muted-foreground">
                  Request a copy of all personal data we hold about you
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Right to Rectification</p>
                <p className="text-xs text-muted-foreground">
                  Request correction of inaccurate or incomplete data
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Right to Erasure</p>
                <p className="text-xs text-muted-foreground">
                  Request deletion of your data ("right to be forgotten")
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Right to Restrict Processing</p>
                <p className="text-xs text-muted-foreground">
                  Request limitation of how we use your data
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Right to Data Portability</p>
                <p className="text-xs text-muted-foreground">
                  Receive your data in a machine-readable format
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-medium text-sm">Right to Object</p>
                <p className="text-xs text-muted-foreground">
                  Object to processing based on legitimate interests
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              To exercise any of these rights, please contact us at{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                {contactEmail}
              </a>{" "}
              or use the Data Privacy settings in your account.
            </p>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              International Data Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Your data may be transferred to and processed in countries outside the UK. 
              When this occurs, we ensure appropriate safeguards are in place:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li>Standard Contractual Clauses (SCCs) approved by the ICO</li>
              <li>Adequacy decisions where the UK has determined a country provides adequate protection</li>
              <li>Binding Corporate Rules for intra-group transfers</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {contactEmail}</p>
              <p><strong>Data Protection Officer:</strong> dpo@carecompliancesystem.co.uk</p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              You also have the right to lodge a complaint with the Information Commissioner's 
              Office (ICO) at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                ico.org.uk
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
