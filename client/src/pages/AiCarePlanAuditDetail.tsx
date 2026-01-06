/**
 * AI Care Plan Audit Detail Page
 * Shows detailed results for a single audit job
 */

import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AiCarePlanAuditDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const jobId = parseInt(id || '0');
  
  // Fetch audit details
  const { data: job, isLoading, refetch } = trpc.aiAuditJobs.getById.useQuery(
    { id: jobId },
    {
      enabled: jobId > 0,
      refetchInterval: (data) => {
        // Auto-refresh if still processing
        return data?.status === 'pending' || data?.status === 'processing' ? 5000 : false;
      },
    }
  );
  
  // Download mutation
  const downloadMutation = trpc.aiAuditJobs.downloadReport.useMutation({
    onMutate: (variables) => {
      console.log('[Download] Mutation started with variables:', variables);
    },
    onSuccess: (data) => {
      console.log('[Download] Mutation success, received data:', data);
      console.log('[Download] downloadUrl:', data.downloadUrl);
      console.log('[Download] filename:', data.filename);
      
      // Create a link element and trigger download
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.filename;
      document.body.appendChild(a);
      console.log('[Download] Link element created and appended');
      a.click();
      console.log('[Download] Link clicked');
      document.body.removeChild(a);
      console.log('[Download] Link removed');
    },
    onError: (error) => {
      console.error('[Download] Mutation error:', error);
    },
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Audit not found</div>
      </div>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/ai-care-plan-audits')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {job.serviceUserName || job.documentName}
            </h1>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {job.status === 'completed' && (
            <Button
              onClick={() => {
                console.log('[Download] Button clicked, jobId:', jobId);
                console.log('[Download] Mutation isPending:', downloadMutation.isPending);
                downloadMutation.mutate({ id: jobId });
              }}
              disabled={downloadMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
          {(job.status === 'pending' || job.status === 'processing') && (
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Current Status:</div>
            {getStatusBadge(job.status)}
          </div>
          
          {job.progress && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Progress:</div>
              <div className="text-blue-600">{job.progress}</div>
            </div>
          )}
          
          {job.errorMessage && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Error:</div>
              <div className="text-red-600">{job.errorMessage}</div>
            </div>
          )}
          
          {job.processedAt && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Completed:</div>
              <div>{formatDistanceToNow(new Date(job.processedAt), { addSuffix: true })}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Results Card */}
      {job.status === 'completed' && job.detailedAnalysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold text-center">
                {job.score}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Sections Analyzed</div>
                  <div className="text-2xl font-bold">
                    {job.detailedAnalysis.analysis.summary.sections_analyzed}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Critical Issues</div>
                  <div className="text-2xl font-bold text-red-600">
                    {job.detailedAnalysis.analysis.summary.critical_issues}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Major Issues</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {job.detailedAnalysis.analysis.summary.major_issues}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Minor Issues</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {job.detailedAnalysis.analysis.summary.minor_issues}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {job.detailedAnalysis.analysis.sections.map((section: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{section.section_name}</h3>
                      <Badge variant="default" className="bg-blue-500">
                        {section.section_score}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {section.issues.length} issue{section.issues.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center text-muted-foreground">
            Download the full report to see detailed analysis and recommendations for each section.
          </div>
        </>
      )}
      
      {/* Processing Message */}
      {(job.status === 'pending' || job.status === 'processing') && (
        <Card>
          <CardContent className="py-8 text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-semibold mb-2">Analysis in Progress</h3>
            <p className="text-muted-foreground">
              Your care plan is being analyzed. This may take several minutes.
              You will be notified when the analysis is complete.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
