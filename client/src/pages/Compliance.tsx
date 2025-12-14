import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Users, Briefcase, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { useLocation as useRouter } from "wouter";

export default function Compliance() {
  const { activeLocationId } = useLocation();
  const [, setLocation] = useRouter();
  
  // Fetch all compliance sections
  const { data: sections, isLoading: sectionsLoading } = trpc.compliance.sections.useQuery();
  
  // Fetch compliance summary for active location
  const { data: summary, isLoading: summaryLoading } = trpc.compliance.summary.useQuery(
    { locationId: activeLocationId || 0 },
    { enabled: !!activeLocationId }
  );
  
  // Fetch overdue actions
  const { data: overdueActions } = trpc.compliance.overdueActions.useQuery(
    { locationId: activeLocationId || 0 },
    { enabled: !!activeLocationId }
  );

  // Fetch assessments for the location
  const { data: assessments } = trpc.compliance.assessmentsByLocation.useQuery(
    { locationId: activeLocationId || 0 },
    { enabled: !!activeLocationId }
  );

  if (!activeLocationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please select a location to view compliance assessments</p>
        </div>
      </div>
    );
  }

  if (sectionsLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group sections by type
  const serviceUserSections = sections?.filter(s => s.sectionType === 'service_user') || [];
  const staffSections = sections?.filter(s => s.sectionType === 'staff') || [];

  // Create a map of section assessments
  const sectionAssessments = new Map();
  assessments?.forEach(assessment => {
    const key = assessment.questionId;
    if (!sectionAssessments.has(key)) {
      sectionAssessments.set(key, assessment);
    }
  });

  const getRAGStatusIcon = (status: string | undefined) => {
    if (!status) return <div className="h-3 w-3 rounded-full bg-gray-300" />;
    
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'amber':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'red':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-300" />;
    }
  };

  const handleSectionClick = (sectionId: number) => {
    setLocation(`/compliance/section/${sectionId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Assessments</h1>
        <p className="text-muted-foreground mt-2">
          Assess and track compliance across all CQC regulatory requirements
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.compliancePercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {summary?.compliant || 0} of {summary?.total || 0} compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.compliant || 0}</div>
            <p className="text-xs text-muted-foreground">Green status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial Compliance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary?.partial || 0}</div>
            <p className="text-xs text-muted-foreground">Amber status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.nonCompliant || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overdueActions?.length || 0} overdue actions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="service-user" className="space-y-6">
        <TabsList>
          <TabsTrigger value="service-user" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Service User Compliance ({serviceUserSections.length} sections)
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Staff Compliance ({staffSections.length} sections)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service-user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service User Compliance Framework</CardTitle>
              <CardDescription>
                {serviceUserSections.length} sections covering all aspects of service user care and CQC requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceUserSections.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {serviceUserSections.map((section) => {
                    // For now, show not assessed since we don't have question-level mapping yet
                    const status = undefined;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <ClipboardCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium">{section.sectionName}</p>
                            <p className="text-xs text-muted-foreground">Section {section.sectionNumber}</p>
                            {section.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          {getRAGStatusIcon(status)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No service user compliance sections found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Compliance Framework</CardTitle>
              <CardDescription>
                {staffSections.length} sections covering staff recruitment, training, and development
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffSections.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {staffSections.map((section) => {
                    // For now, show not assessed since we don't have question-level mapping yet
                    const status = undefined;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium">{section.sectionName}</p>
                            <p className="text-xs text-muted-foreground">Section {section.sectionNumber}</p>
                            {section.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          {getRAGStatusIcon(status)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No staff compliance sections found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {overdueActions && overdueActions.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Overdue Actions
            </CardTitle>
            <CardDescription className="text-red-700">
              {overdueActions.length} action{overdueActions.length !== 1 ? 's' : ''} require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueActions.slice(0, 5).map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div>
                    <p className="font-medium text-sm">Question ID: {action.questionId}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {action.targetCompletionDate ? new Date(action.targetCompletionDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
              {overdueActions.length > 5 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  And {overdueActions.length - 5} more overdue action{overdueActions.length - 5 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
