import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { helpArticles, helpCategories } from "@/data/helpContent";
import { useLocation, useRoute } from "wouter";
import Markdown from "react-markdown";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ContactSupportModal } from "@/components/ContactSupportModal";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";

import { ArrowLeft, ThumbsUp, ThumbsDown, CaretRight } from "@phosphor-icons/react";
export default function HelpArticle() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/help/:id");
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const article = useMemo(() => {
    if (!params?.id) return null;
    return helpArticles.find((a) => a.id === params.id);
  }, [params?.id]);

  const category = useMemo(() => {
    if (!article) return null;
    return helpCategories.find((c) => c.id === article.category);
  }, [article]);

  // Get related articles from same category
  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return helpArticles
      .filter((a) => a.category === article.category && a.id !== article.id)
      .slice(0, 3);
  }, [article]);

  // Check if user already submitted feedback
  const { data: userFeedback } = trpc.helpCenter.getUserFeedback.useQuery(
    { articleId: article?.id || "" },
    { enabled: !!article?.id }
  );

  // Feedback mutation
  const submitFeedback = trpc.helpCenter.submitFeedback.useMutation({
    onSuccess: () => {
      setFeedbackSubmitted(true);
      toast.success("Thank you for your feedback!");
    },
    onError: (error) => {
      toast.error("Failed to submit feedback", {
        description: error.message,
      });
    },
  });

  const { user } = useAuth();

  // Handle feedback
  const handleFeedback = (helpful: boolean) => {
    if (!article) return;
    
    if (!user) {
      toast.info("Please sign in to submit feedback");
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 1500);
      return;
    }
    
    submitFeedback.mutate({
      articleId: article.id,
      helpful,
    });
  };

  if (!article || !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6">
            The help article you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => setLocation("/help")} className="bg-[#1F7AE0] hover:bg-[#1a6bc7]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Centre
          </Button>
        </div>
      </div>
    );
  }

  const hasFeedback = !!userFeedback || feedbackSubmitted;

  // Get all categories for sidebar
  const popularTopics = helpCategories.slice(0, 8);

  return (
    <div className="min-h-screen bg-white">
      {/* Clean header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container max-w-6xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/help")}>
                <img src="/logo.png" alt="CCMS" className="h-8 w-8" />
                <span className="font-semibold text-gray-900">CCMS Help Centre</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <CaretRight className="h-4 w-4" />
                <span className="text-gray-700 truncate max-w-[200px]">{article.title}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLocation("/help")}
                className="flex items-center gap-2 text-gray-600 hover:text-[#1F7AE0] transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">All Articles</span>
              </button>
              {!user && (
                <>
                  <button 
                    onClick={() => setLocation("/login")}
                    className="text-sm text-[#1F7AE0] hover:text-[#1a6bc7] font-medium"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => setLocation("/register")}
                    className="text-sm bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl py-10">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main content */}
          <main className="lg:col-span-8">
            {/* Title and tags */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            
            {/* Category tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge 
                variant="secondary" 
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                onClick={() => setLocation(`/help?category=${category.id}`)}
              >
                {category.name}
              </Badge>
            </div>

            {/* Article content - clean prose styling */}
            <div className="prose prose-gray max-w-none
              prose-headings:font-semibold prose-headings:text-gray-900
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-[#1F7AE0] prose-a:no-underline hover:prose-a:underline
              prose-ul:my-4 prose-ul:pl-6
              prose-ol:my-4 prose-ol:pl-6
              prose-li:text-gray-700 prose-li:mb-2
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-800
              prose-blockquote:border-l-4 prose-blockquote:border-[#1F7AE0] prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-4 prose-blockquote:text-gray-700 prose-blockquote:not-italic
            ">
              <Markdown>{article.content}</Markdown>
            </div>

            {/* Feedback section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-900 font-medium mb-4">Did this answer your question?</p>
              {hasFeedback ? (
                <p className="text-green-600 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Thank you for your feedback!
                </p>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 border-gray-300 hover:bg-gray-50"
                    onClick={() => handleFeedback(true)}
                    disabled={submitFeedback.isPending}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 border-gray-300 hover:bg-gray-50"
                    onClick={() => handleFeedback(false)}
                    disabled={submitFeedback.isPending}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </Button>
                </div>
              )}
            </div>

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Related articles</h2>
                <div className="space-y-3">
                  {relatedArticles.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => setLocation(`/help/${related.id}`)}
                      className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#1F7AE0] hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 hover:text-[#1F7AE0]">
                        {related.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {related.content.substring(0, 120).replace(/[#*]/g, "")}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              {/* Popular topics */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Popular topics</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTopics.map((topic) => (
                    <Badge
                      key={topic.id}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-[#1F7AE0] hover:text-white cursor-pointer transition-colors"
                      onClick={() => setLocation(`/help?category=${topic.id}`)}
                    >
                      {topic.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact support */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Contact support</h3>
                <p className="text-sm text-gray-600 mb-4">24×7 help from our support staff</p>
                <Button 
                  onClick={() => setSupportModalOpen(true)}
                  className="w-full bg-[#1F7AE0] hover:bg-[#1a6bc7]"
                >
                  Get help
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ContactSupportModal 
        open={supportModalOpen} 
        onOpenChange={setSupportModalOpen} 
      />
      
      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} CCMS. Built by <a href="https://lampstand.consulting" target="_blank" rel="noopener noreferrer" className="hover:text-[#1F7AE0] transition-colors">Lampstand Consulting</a>.</p>
        <div className="mt-2 space-x-4">
          <a href="/privacy" className="hover:text-gray-700">Privacy</a>
          <a href="/terms" className="hover:text-gray-700">Terms</a>
        </div>
      </footer>
    </div>
  );
}
