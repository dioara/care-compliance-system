import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useLocation } from "wouter";

import { ArrowLeft } from "@phosphor-icons/react";
export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to the Care Compliance Management System ("Service"), a software-as-a-service platform 
                designed to help UK care providers manage compliance with Care Quality Commission (CQC) standards. 
                By accessing or using our Service, you agree to be bound by these Terms of Service ("Terms").
              </p>
              <p className="text-muted-foreground">
                These Terms constitute a legally binding agreement between you ("Customer", "you", or "your") 
                and the Care Compliance Management System provider ("we", "us", or "our"). Please read these 
                Terms carefully before using the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Subscription and Pricing</h2>
              <h3 className="text-lg font-medium mb-2">2.1 Subscription Fee</h3>
              <p className="text-muted-foreground mb-4">
                The Service is provided on a subscription basis at <strong>£70 per month per license</strong>. 
                Organisations can purchase multiple licenses as needed. Each license covers access to all core 
                features including compliance assessments, audit management, staff and service user management, 
                reporting, and standard support.
              </p>
              
              <h3 className="text-lg font-medium mb-2">2.2 AI-Powered Features</h3>
              <p className="text-muted-foreground mb-4">
                Certain advanced features, including AI-powered document audits and care plan analysis, require 
                you to provide your own OpenAI API key. Usage of these AI features is subject to OpenAI's terms 
                of service and pricing. We do not charge additional fees for AI features beyond your OpenAI API costs.
              </p>
              
              <h3 className="text-lg font-medium mb-2">2.3 Billing</h3>
              <p className="text-muted-foreground">
                Subscription fees are billed monthly in advance. Payment is due on the same date each month as 
                your initial subscription date. We accept major credit and debit cards. All prices are exclusive 
                of VAT, which will be added where applicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the Service in any way that violates any applicable UK or international law or regulation</li>
                <li>Use the Service to store, transmit, or process any data that you do not have the right to use</li>
                <li>Attempt to gain unauthorised access to any part of the Service or any systems connected to the Service</li>
                <li>Use the Service to transmit any malicious code, viruses, or harmful content</li>
                <li>Share your account credentials with unauthorised users</li>
                <li>Use the Service in any manner that could disable, overburden, or impair the Service</li>
                <li>Use automated scripts, bots, or other means to access the Service without our express permission</li>
                <li>Resell, sublicense, or redistribute the Service without our written consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Data Protection and GDPR Compliance</h2>
              <h3 className="text-lg font-medium mb-2">4.1 Data Controller and Processor</h3>
              <p className="text-muted-foreground mb-4">
                You remain the Data Controller for all personal data you process using the Service. We act as a 
                Data Processor on your behalf, processing personal data only in accordance with your instructions 
                and applicable data protection laws, including the UK GDPR and Data Protection Act 2018.
              </p>
              
              <h3 className="text-lg font-medium mb-2">4.2 Data Processing Agreement</h3>
              <p className="text-muted-foreground mb-4">
                By using the Service, you agree to our Data Processing Agreement, which forms part of these Terms. 
                We implement appropriate technical and organisational measures to ensure a level of security 
                appropriate to the risk of processing personal data.
              </p>
              
              <h3 className="text-lg font-medium mb-2">4.3 Data Anonymisation</h3>
              <p className="text-muted-foreground">
                When using AI-powered features, all documents are automatically anonymised before processing. 
                Personal identifiers such as names are converted to initials, and other personally identifiable 
                information is removed or masked to protect service user privacy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Service Availability and Support</h2>
              <h3 className="text-lg font-medium mb-2">5.1 Service Level</h3>
              <p className="text-muted-foreground mb-4">
                We aim to provide 99.5% uptime for the Service, excluding scheduled maintenance windows. 
                Scheduled maintenance will be communicated at least 48 hours in advance where possible.
              </p>
              
              <h3 className="text-lg font-medium mb-2">5.2 Support</h3>
              <p className="text-muted-foreground">
                Standard support is included in your subscription and is available via email during UK business 
                hours (Monday to Friday, 9:00 AM to 5:00 PM GMT, excluding bank holidays). We aim to respond to 
                support requests within 24 business hours.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
              <h3 className="text-lg font-medium mb-2">6.1 Disclaimer</h3>
              <p className="text-muted-foreground mb-4">
                The Service is provided "as is" and "as available" without warranties of any kind, either express 
                or implied. While we strive to provide accurate compliance guidance, the Service does not 
                constitute legal or regulatory advice. You remain solely responsible for ensuring your care 
                services comply with all applicable laws and CQC regulations.
              </p>
              
              <h3 className="text-lg font-medium mb-2">6.2 Limitation</h3>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to loss of profits, data, 
                use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Your access to or use of (or inability to access or use) the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorised access, use, or alteration of your transmissions or content</li>
                <li>Any CQC inspection outcomes or regulatory actions</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">6.3 Cap on Liability</h3>
              <p className="text-muted-foreground">
                Our total liability to you for any claims arising from or related to these Terms or the Service 
                shall not exceed the total amount you have paid to us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Cancellation and Termination</h2>
              <h3 className="text-lg font-medium mb-2">7.1 Cancellation by You</h3>
              <p className="text-muted-foreground mb-4">
                You may cancel your subscription at any time by providing written notice through your account 
                settings or by contacting our support team. Cancellation will take effect at the end of your 
                current billing period. No refunds will be provided for partial months.
              </p>
              
              <h3 className="text-lg font-medium mb-2">7.2 Termination by Us</h3>
              <p className="text-muted-foreground mb-4">
                We may suspend or terminate your access to the Service immediately, without prior notice or 
                liability, for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Breach of these Terms</li>
                <li>Non-payment of subscription fees</li>
                <li>Fraudulent or illegal activity</li>
                <li>Actions that may harm other users or the Service</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">7.3 Effect of Termination</h3>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service will immediately cease. You may request an export 
                of your data within 30 days of termination. After this period, we may delete your data in 
                accordance with our data retention policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Service and its original content, features, and functionality are and will remain the 
                exclusive property of the Care Compliance Management System provider. The Service is protected 
                by copyright, trademark, and other laws of the United Kingdom and foreign countries.
              </p>
              <p className="text-muted-foreground">
                You retain all rights to your data and content uploaded to the Service. By uploading content, 
                you grant us a limited licence to store, process, and display that content solely for the 
                purpose of providing the Service to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes 
                a material change will be determined at our sole discretion. By continuing to access or use our 
                Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Governing Law and Jurisdiction</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of England and Wales, 
                without regard to its conflict of law provisions. Any disputes arising from or relating to these 
                Terms or the Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us through the support channels 
                provided in your account dashboard or by email at the address provided during registration.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                By using the Care Compliance Management System, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
