import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, AlertCircle, XCircle, User, MessageSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface CareNoteAnalysis {
  length_detail_score: number;
  person_centred_score: number;
  professional_language_score: number;
  outcome_focused_score: number;
  evidence_based_score: number;
  language_issues: Array<{
    problematic_text: string;
    explanation: string;
    use_instead: string;
  }>;
  whats_missing: string[];
  positive_aspects: string[];
  improved_version: string;
  carer_feedback: string;
}

interface CareNotesResultsProps {
  analysis: {
    [noteId: string]: CareNoteAnalysis;
  };
  nameMappings?: Array<{ original: string; abbreviated: string }>;
}

export function CareNotesResults({ analysis, nameMappings }: CareNotesResultsProps) {
  const notes = Object.entries(analysis);
  
  // Calculate overall scores
  const calculateOverallScore = (note: CareNoteAnalysis) => {
    return Math.round(
      note.length_detail_score * 0.15 +
      note.person_centred_score * 0.25 +
      note.professional_language_score * 0.20 +
      note.outcome_focused_score * 0.20 +
      note.evidence_based_score * 0.20
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Care Notes Analysis Summary</CardTitle>
          <CardDescription>
            Analyzed {notes.length} care {notes.length === 1 ? 'note' : 'notes'} for CQC compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{notes.length}</div>
              <div className="text-sm text-muted-foreground">Total Notes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {notes.filter(([_, n]) => calculateOverallScore(n) >= 85).length}
              </div>
              <div className="text-sm text-muted-foreground">Excellent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {notes.filter(([_, n]) => {
                  const score = calculateOverallScore(n);
                  return score >= 50 && score < 85;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Need Work</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {notes.filter(([_, n]) => calculateOverallScore(n) < 50).length}
              </div>
              <div className="text-sm text-muted-foreground">Poor</div>
            </div>
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

      {/* Individual Note Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Note Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown for each care note
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {notes.map(([noteId, note]) => {
              const overallScore = calculateOverallScore(note);
              const scoreColor = getScoreColor(overallScore);
              const scoreLabel = getScoreLabel(overallScore);

              return (
                <AccordionItem key={noteId} value={noteId}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>Note {parseInt(noteId) + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={overallScore >= 85 ? 'default' : 'secondary'}>
                          {scoreLabel}
                        </Badge>
                        <span className={`font-bold ${scoreColor}`}>
                          {overallScore}%
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Score Breakdown */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Score Breakdown</h4>
                        <div className="space-y-2">
                          <ScoreBar label="Length & Detail" score={note.length_detail_score} />
                          <ScoreBar label="Person-Centred" score={note.person_centred_score} />
                          <ScoreBar label="Professional Language" score={note.professional_language_score} />
                          <ScoreBar label="Outcome-Focused" score={note.outcome_focused_score} />
                          <ScoreBar label="Evidence-Based" score={note.evidence_based_score} />
                        </div>
                      </div>

                      {/* Positive Aspects */}
                      {note.positive_aspects.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            What's Good
                          </h4>
                          <ul className="space-y-1">
                            {note.positive_aspects.map((aspect, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-green-600">•</span>
                                <span>{aspect}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Language Issues */}
                      {note.language_issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Language Issues
                          </h4>
                          <div className="space-y-2">
                            {note.language_issues.map((issue, i) => (
                              <div key={i} className="text-sm border-l-2 border-red-600 pl-3 py-1">
                                <div className="font-medium text-red-600">
                                  "{issue.problematic_text}"
                                </div>
                                <div className="text-muted-foreground">{issue.explanation}</div>
                                <div className="text-green-600">
                                  ✓ Use instead: "{issue.use_instead}"
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* What's Missing */}
                      {note.whats_missing.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            What's Missing
                          </h4>
                          <ul className="space-y-1">
                            {note.whats_missing.map((missing, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-yellow-600">•</span>
                                <span>{missing}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improved Version */}
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          CQC-Compliant Version
                        </h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{note.improved_version}</p>
                        </div>
                      </div>

                      {/* Carer Feedback */}
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          Feedback for Carer
                        </h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{note.carer_feedback}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 85) return 'bg-green-600';
    if (score >= 70) return 'bg-blue-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
