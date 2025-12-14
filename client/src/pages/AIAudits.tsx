import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Upload, FileText, AlertCircle } from "lucide-react";

export default function AIAudits() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8" />
          AI-Powered Audits
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload care plans and daily notes for instant quality analysis and feedback
        </p>
      </div>

      <Tabs defaultValue="care-plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="care-plans">Care Plan Audits</TabsTrigger>
          <TabsTrigger value="daily-notes">Daily Notes Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="care-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Care Plan Quality Audit</CardTitle>
              <CardDescription>
                Upload care plans for AI analysis. Names are automatically stripped to initials for GDPR compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Upload Care Plan Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, Word (DOCX)
                  </p>
                </div>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">What the AI Analyzes:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Person-centredness and individual preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Comprehensiveness and detail of care planning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Risk assessments and management strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>CQC compliance and best practice alignment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Review dates and monitoring arrangements</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  AI audit functionality with GPT-4 integration coming soon. Background processing with email notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Daily Notes Quality Audit</CardTitle>
              <CardDescription>
                Upload staff daily notes for AI analysis of quality, detail, and professionalism.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Upload Daily Notes Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, Word (DOCX)
                  </p>
                </div>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">What the AI Analyzes:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Level of detail and descriptiveness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Person-centred language and approach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Professional tone and record-keeping standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Evidence of care plan implementation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Identification of changes in needs or concerns</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  AI audit functionality with GPT-4 integration coming soon. Background processing with email notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
