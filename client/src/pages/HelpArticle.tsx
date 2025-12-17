import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, ChevronRight, HelpCircle, Clock, ThumbsUp, ThumbsDown, Share2, Bookmark } from "lucide-react";
import { helpArticles, helpCategories } from "@/data/helpContent";
import { useLocation, useRoute } from "wouter";
import Markdown from "react-markdown";

export default function HelpArticle() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/help/:id");
  
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

  if (!article || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-12 text-center shadow-xl border-0">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Article Not Found</h2>
          <p className="text-gray-600 mb-8">
            The help article you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => setLocation("/help")} size="lg" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Center
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="container max-w-7xl py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => setLocation("/help")}
              className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Button>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HelpCircle className="h-4 w-4" />
              <button 
                onClick={() => setLocation("/help")}
                className="hover:text-indigo-600 transition-colors"
              >
                Help Center
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-400">{category.name}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium max-w-[200px] truncate">{article.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <Card className="bg-white shadow-xl border-0 overflow-hidden">
              {/* Article header */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-10 md:p-12 border-b border-gray-200">
                <Badge 
                  variant="secondary" 
                  className="mb-5 text-sm px-4 py-1.5 bg-white text-indigo-700 hover:bg-white shadow-sm font-semibold"
                >
                  <span className="mr-2 text-lg">{category.icon}</span>
                  {category.name}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
                  {article.title}
                </h1>
                
                {/* Article meta */}
                <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>5 min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      Updated recently
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Article content */}
              <div className="p-10 md:p-12">
                <div className="prose prose-lg prose-indigo max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900 prose-headings:scroll-mt-20
                  prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-gray-200
                  prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5 prose-p:text-[17px]
                  prose-strong:text-gray-900 prose-strong:font-bold
                  prose-ul:my-6 prose-ul:space-y-3
                  prose-ol:my-6 prose-ol:space-y-3
                  prose-li:text-gray-700 prose-li:text-[17px] prose-li:leading-relaxed
                  prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-indigo-700
                  prose-code:text-sm prose-code:bg-indigo-50 prose-code:text-indigo-700 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:font-semibold prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-gray-700
                  prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-700
                  prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                  prose-hr:my-10 prose-hr:border-gray-300
                  prose-table:my-8 prose-table:border-collapse
                  prose-th:bg-gray-100 prose-th:font-bold prose-th:text-gray-900 prose-th:p-3 prose-th:border prose-th:border-gray-300
                  prose-td:p-3 prose-td:border prose-td:border-gray-300
                ">
                  <Markdown>{article.content}</Markdown>
                </div>

                {/* Feedback section */}
                <div className="mt-16 pt-10 border-t-2 border-gray-200">
                  <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                    <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-3">
                      <div className="bg-indigo-600 text-white rounded-full p-2">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      Was this article helpful?
                    </h3>
                    <p className="text-gray-700 mb-6 text-base leading-relaxed">
                      Your feedback helps us improve our documentation and provide better support to all users.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <Button variant="outline" className="gap-2 bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all">
                        <ThumbsUp className="h-4 w-4" />
                        Yes, this helped
                      </Button>
                      <Button variant="outline" className="gap-2 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all">
                        <ThumbsDown className="h-4 w-4" />
                        No, needs improvement
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                  Related Articles
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedArticles.map((related) => (
                    <Card
                      key={related.id}
                      className="group bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden"
                      onClick={() => setLocation(`/help/${related.id}`)}
                    >
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                      <div className="p-6">
                        <h3 className="font-bold text-base text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                          {related.content.substring(0, 100).replace(/[#*]/g, "")}...
                        </p>
                        <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
                          Read article
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Quick actions */}
              <Card className="bg-white shadow-lg border-0 p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                    <Share2 className="h-4 w-4" />
                    Share this article
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                    <Bookmark className="h-4 w-4" />
                    Bookmark for later
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/")}
                    className="w-full justify-start gap-3 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                  >
                    <Home className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </div>
              </Card>

              {/* Category info */}
              <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-indigo-200 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-3 shadow-lg">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">
                      {helpArticles.filter(a => a.category === category.id).length} articles
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {category.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLocation("/help");
                    // Note: Would need to pass category filter state
                  }}
                  className="w-full bg-white hover:bg-indigo-600 hover:text-white transition-all"
                >
                  View all {category.name} articles
                </Button>
              </Card>

              {/* Support CTA */}
              <Card className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white border-0 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="relative p-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Need More Help?</h3>
                  <p className="text-blue-100 text-sm mb-5 leading-relaxed">
                    Our support team is ready to assist you with any questions.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full border-2 border-white text-white hover:bg-white hover:text-indigo-600 transition-all font-semibold"
                  >
                    Contact Support
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
