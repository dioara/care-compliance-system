/**
 * AI Care Plan Audits List Page
 * Shows all audit jobs with status tracking and download options
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Download, Eye, Trash2, RefreshCw, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function AiCarePlanAudits() {
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  
  // Fetch audit jobs list
  const { data, isLoading, refetch } = trpc.aiAuditJobs.list.useQuery({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: 50,
    offset: 0,
  }, {
    refetchInterval: (data) => {
      // Auto-refresh every 5 seconds if there are pending/processing jobs
      const hasPendingJobs = data?.jobs.some(j => j.status === 'pending' || j.status === 'processing');
      return hasPendingJobs ? 5000 : false;
    },
  });
  
  // Fetch statistics
  const { data: stats } = trpc.aiAuditJobs.getStats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Delete mutation
  const deleteMutation = trpc.aiAuditJobs.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  // Download mutation
  const downloadMutation = trpc.aiAuditJobs.downloadReport.useMutation({
    onSuccess: (data) => {
      console.log('[Download] Mutation success, received data:', data);
      // Create a link element and trigger download
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    onError: (error) => {
      console.error('[Download] Mutation error:', error);
      toast.error(`Failed to download report: ${error?.message || 'Unknown error'}`);
    },
  });
  
  const handleDownload = (jobId: number) => {
    downloadMutation.mutate({ id: jobId });
  };
  
  const handleView = (jobId: number) => {
    setLocation(`/ai-care-plan-audits/${jobId}`);
  };
  
  const handleDelete = (jobId: number) => {
    if (confirm('Are you sure you want to delete this audit?')) {
      deleteMutation.mutate({ id: jobId });
    }
  };
  
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
  
  const getScoreBadge = (score: number | null) => {
    if (score === null) return null;
    
    let color = 'bg-red-500';
    if (score >= 80) color = 'bg-green-500';
    else if (score >= 60) color = 'bg-yellow-500';
    else if (score >= 40) color = 'bg-orange-500';
    
    return <Badge variant="default" className={color}>{score}%</Badge>;
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Care Plan Audits</h1>
          <p className="text-muted-foreground">View and manage your AI-powered care plan analyses</p>
        </div>
        <Button onClick={() => setLocation('/ai-care-plan-audit')}>
          <FileText className="mr-2 h-4 w-4" />
          New Audit
        </Button>
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('all')}
            >
              All
            </Button>
            <Button
              variant={selectedStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('pending')}
            >
              Pending
            </Button>
            <Button
              variant={selectedStatus === 'processing' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('processing')}
            >
              Processing
            </Button>
            <Button
              variant={selectedStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('completed')}
            >
              Completed
            </Button>
            <Button
              variant={selectedStatus === 'failed' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('failed')}
            >
              Failed
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Audits List */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8">Loading...</div>
          )}
          
          {!isLoading && data?.jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audits found. Create your first audit to get started.
            </div>
          )}
          
          {!isLoading && data && data.jobs.length > 0 && (
            <div className="space-y-4">
              {data.jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {job.serviceUserName || job.documentName}
                      </h3>
                      {getStatusBadge(job.status)}
                      {job.score !== null && getScoreBadge(job.score)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </div>
                      {job.progress && (
                        <div className="text-blue-600">{job.progress}</div>
                      )}
                      {job.errorMessage && (
                        <div className="text-red-600">Error: {job.errorMessage}</div>
                      )}
                      {job.processedAt && (
                        <div>
                          Completed {formatDistanceToNow(new Date(job.processedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {job.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(job.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(job.id)}
                          disabled={downloadMutation.isPending}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </>
                    )}
                    
                    {job.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(job.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    )}
                    
                    {(job.status === 'pending' || job.status === 'processing') && (
                      <Button variant="outline" size="sm" disabled>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {job.status === 'pending' ? 'Queued' : 'Processing'}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
