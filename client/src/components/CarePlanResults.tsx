import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, AlertCircle, XCircle, Lightbulb, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface CarePlanResultsProps {
  analysis: {
    compliance_score: number;
    area_coverage: {
      area: string;
      status: 'present' | 'partial' | 'missing';
      issues?: string;
    }[];
    problems: string[];
    enhanced_version: string;
    whats_missing: string[];
    cqc_requirements: string[];
    recommendations: string[];
  };
  nameMappings?: Array<{ original: string; abbreviated: string }>;
}

export function CarePlanResults({ analysis, nameMappings }: CarePlanResultsProps) {
  const { compliance_score, area_coverage, problems, enhanced_version, whats_missing, cqc_requirements, recommendations } = analysis;

  // Determine compliance level
  const getComplianceLevel = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 };
    if (score >= 50) return { label: 'Needs Improvement', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertCircle };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
  };

  const level = getComplianceLevel(compliance_score);
  const Icon = level.icon;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CQC Compliance Score</CardTitle>
              <CardDescription>Overall assessment of care plan quality</CardDescription>
            </div>
            <div className={`flex items-center gap-2 ${level.color}`}>
              <Icon className="h-6 w-6" />
              <span className="text-2xl font-bold">{compliance_score}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={compliance_score} className="h-3" />
          <div className="mt-2 flex items-center justify-between">
            <Badge className={level.bg + ' ' + level.color} variant="secondary">
              {level.label}
            </Badge>
            {compliance_score < 85 && (
              <span className="text-sm text-muted-foreground">
                Target: 85% for CQC compliance
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Name Mappings (if anonymized) */}
      {nameMappings && nameMappings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Names Anonymized:</strong>{' '}
            {nameMappings.map((m, i) => (
              <span key={i}>
                {m.original} → {m.abbreviated}
                {i < nameMappings.length - 1 ? ', ' : ''}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="coverage" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="coverage">Area Coverage</TabsTrigger>
          <TabsTrigger value="problems">Problems ({problems.length})</TabsTrigger>
          <TabsTrigger value="missing">Missing ({whats_missing.length})</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Version</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Area Coverage Tab */}
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                CQC-Required Care Plan Areas
              </CardTitle>
              <CardDescription>
                Coverage status of essential care plan sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {area_coverage.map((area, index) => {
                  const statusConfig = {
                    present: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Present' },
                    partial: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Partial' },
                    missing: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Missing' },
                  };
                  const config = statusConfig[area.status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={index} className={`p-4 rounded-lg border ${config.bg}`}>
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`h-5 w-5 ${config.color} mt-0.5`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{area.area}</h4>
                            <Badge variant={area.status === 'present' ? 'default' : 'secondary'} className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                          {area.issues && (
                            <p className="text-sm text-muted-foreground mt-2">{area.issues}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Problems Tab */}
        <TabsContent value="problems" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Issues Found
              </CardTitle>
              <CardDescription>
                Specific problems that need to be addressed for CQC compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No problems found! 🎉</p>
              ) : (
                <ol className="space-y-3 list-decimal list-inside">
                  {problems.map((problem, index) => (
                    <li key={index} className="text-sm">
                      <span className="ml-2">{problem}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* CQC Requirements */}
          {cqc_requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  CQC Requirements
                </CardTitle>
                <CardDescription>
                  Relevant CQC fundamental standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {cqc_requirements.map((req, index) => (
                    <li key={index} className="text-sm border-l-2 border-blue-600 pl-3 py-1">
                      {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Missing Elements Tab */}
        <TabsContent value="missing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Missing Elements
              </CardTitle>
              <CardDescription>
                Information that should be added to improve compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {whats_missing.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing missing! 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {whats_missing.map((item, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Version Tab */}
        <TabsContent value="enhanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                CQC-Compliant Version
              </CardTitle>
              <CardDescription>
                Enhanced care plan with all issues resolved - ready to copy and paste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {enhanced_version}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                Actionable Recommendations
              </CardTitle>
              <CardDescription>
                Specific steps to improve this care plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recommendations needed! 🎉</p>
              ) : (
                <ol className="space-y-3 list-decimal list-inside">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      <span className="ml-2">{rec}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
