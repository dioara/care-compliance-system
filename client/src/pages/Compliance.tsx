import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Users, Briefcase, AlertCircle } from "lucide-react";

export default function Compliance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Assessments</h1>
        <p className="text-muted-foreground mt-2">
          Assess and track compliance across all CQC regulatory requirements
        </p>
      </div>

      <Tabs defaultValue="service-user" className="space-y-6">
        <TabsList>
          <TabsTrigger value="service-user" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Service User Compliance (22 sections)
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Staff Compliance (7 sections)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service-user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service User Compliance Framework</CardTitle>
              <CardDescription>
                22 sections covering all aspects of service user care and CQC requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: "Respecting & Involving People", status: "green" },
                  { name: "Consent", status: "green" },
                  { name: "Care and Welfare", status: "amber" },
                  { name: "Meeting Nutritional Needs", status: "green" },
                  { name: "Co-operating with Providers", status: "green" },
                  { name: "Safeguarding", status: "amber" },
                  { name: "Infection Control", status: "red" },
                  { name: "Management of Medicine", status: "amber" },
                  { name: "Safety of Premises", status: "green" },
                  { name: "Safety of Equipment", status: "green" },
                  { name: "Recruitment", status: "green" },
                  { name: "Staff Deployment", status: "amber" },
                ].map((section, index) => (
                  <button
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{section.name}</p>
                        <p className="text-xs text-muted-foreground">Section {index + 1}</p>
                      </div>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        section.status === "green"
                          ? "bg-green-500"
                          : section.status === "amber"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Click on any section to view questions and update compliance status. Full functionality coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Compliance Framework</CardTitle>
              <CardDescription>
                7 sections covering staff recruitment, training, and development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: "Recruitment & Vetting", status: "green" },
                  { name: "Induction & Onboarding", status: "green" },
                  { name: "Training & Development", status: "amber" },
                  { name: "Supervision & Appraisal", status: "green" },
                  { name: "Competency & Observation", status: "amber" },
                  { name: "Health & Wellbeing", status: "green" },
                  { name: "Conduct & Capability", status: "green" },
                ].map((section, index) => (
                  <button
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{section.name}</p>
                        <p className="text-xs text-muted-foreground">Section {index + 1}</p>
                      </div>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        section.status === "green"
                          ? "bg-green-500"
                          : section.status === "amber"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Click on any section to view questions and update compliance status. Full functionality coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
