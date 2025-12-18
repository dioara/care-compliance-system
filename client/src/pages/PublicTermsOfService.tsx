import { useLocation } from "wouter";
import { Shield, ArrowLeft, FileText, Scale, AlertTriangle, CreditCard, Ban, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicTermsOfService() {
  const [, setLocation] = useLocation();
  const lastUpdated = "December 2025";
  const companyName = "Care Compliance Management System";

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
          <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1F7AE0]" />
              Agreement to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the {companyName} platform 
              ("Service"), operated by UK Health Kits LTD ("Company", "we", "us", or "our").
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with 
              any part of these Terms, you may not access the Service.
            </p>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1F7AE0]" />
              Service Description
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <p>
              CCMS is a compliance management platform designed for care homes and healthcare organisations 
              in the United Kingdom. Our Service provides:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li>Compliance audit scheduling and management</li>
              <li>CQC inspection preparation tools</li>
              <li>Incident reporting and tracking</li>
              <li>Staff training and compliance monitoring</li>
              <li>Document management and policy tracking</li>
              <li>AI-powered care plan auditing</li>
              <li>Regulatory compliance reporting</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#1F7AE0]" />
              User Accounts & Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Account Registration</h4>
              <p className="text-sm">
                To use our Service, you must register for an account. You agree to provide accurate, 
                current, and complete information during registration and to update such information 
                to keep it accurate, current, and complete.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Account Security</h4>
              <p className="text-sm">
                You are responsible for safeguarding the password you use to access the Service and for 
                any activities or actions under your password. You must notify us immediately upon becoming 
                aware of any breach of security or unauthorised use of your account.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Acceptable Use</h4>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                <li>Not use the Service in any way that violates applicable laws or regulations</li>
                <li>Not attempt to gain unauthorised access to any part of the Service</li>
                <li>Not interfere with or disrupt the Service or servers connected to the Service</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#1F7AE0]" />
              Subscription & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Free Trial</h4>
              <p className="text-sm">
                We offer a 14-day free trial for new users. No credit card is required to start your trial. 
                At the end of your trial period, you will need to subscribe to a paid plan to continue using 
                the Service.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Subscription Plans</h4>
              <p className="text-sm">
                We offer monthly and annual subscription plans. Annual subscriptions include one month free. 
                Prices are displayed in GBP and are subject to VAT where applicable.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Processing</h4>
              <p className="text-sm">
                Payments are processed securely through Stripe. By providing payment information, you 
                authorise us to charge the applicable subscription fees to your payment method.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cancellation</h4>
              <p className="text-sm">
                You may cancel your subscription at any time. Upon cancellation, you will retain access 
                to the Service until the end of your current billing period. No refunds are provided for 
                partial months or unused portions of annual subscriptions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1F7AE0]" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <p className="text-sm">
              Your use of the Service is also governed by our Privacy Policy, which describes how we 
              collect, use, and protect your personal data. By using the Service, you consent to the 
              collection and use of information as described in our Privacy Policy.
            </p>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Data</h4>
              <p className="text-sm">
                You retain all rights to the data you input into the Service. We do not claim ownership 
                of your content. You grant us a limited licence to use your data solely for the purpose 
                of providing the Service to you.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Export</h4>
              <p className="text-sm">
                You may export your data at any time through the Service's export functionality. Upon 
                account termination, we will provide you with a reasonable period to export your data 
                before deletion.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#1F7AE0]" />
              Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <p className="text-sm">
              To the maximum extent permitted by law, in no event shall the Company, its directors, 
              employees, partners, agents, suppliers, or affiliates be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including without limitation, 
              loss of profits, data, use, goodwill, or other intangible losses.
            </p>
            <p className="text-sm">
              The Service is provided as a tool to assist with compliance management. It does not 
              replace professional legal, medical, or regulatory advice. You remain responsible for 
              ensuring your organisation's compliance with all applicable laws and regulations.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-[#1F7AE0]" />
              Termination
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600 space-y-4">
            <p className="text-sm">
              We may terminate or suspend your account immediately, without prior notice or liability, 
              for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p className="text-sm">
              Upon termination, your right to use the Service will immediately cease. If you wish to 
              terminate your account, you may simply discontinue using the Service or contact us to 
              request account deletion.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#1F7AE0]" />
              Changes to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            <p className="text-sm">
              We reserve the right to modify or replace these Terms at any time. If a revision is 
              material, we will provide at least 30 days' notice prior to any new terms taking effect. 
              What constitutes a material change will be determined at our sole discretion.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700"><strong>Email:</strong> legal@ccms.co.uk</p>
              <p className="text-sm text-gray-700"><strong>Company:</strong> UK Health Kits LTD</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-sm pt-4">
          <button onClick={() => setLocation("/privacy")} className="text-[#1F7AE0] hover:underline">
            Privacy Policy
          </button>
          <button onClick={() => setLocation("/help")} className="text-[#1F7AE0] hover:underline">
            Help Centre
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} CCMS. Built by Lampstand Consulting.</p>
      </footer>
    </div>
  );
}
