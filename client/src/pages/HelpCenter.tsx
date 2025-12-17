import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Book, ArrowLeft, Home, ChevronRight, HelpCircle } from "lucide-react";
import { helpArticles, helpCategories, type HelpArticle } from "@/data/helpContent";
import { useLocation } from "wouter";
import Markdown from "react-markdown";

export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    let results = helpArticles;

    // Filter by category
    if (selectedCategory) {
      results = results.filter((article) => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    return results;
  }, [searchQuery, selectedCategory]);

  // Group articles by category for display
  const groupedArticles = useMemo(() => {
    const groups: Record<string, HelpArticle[]> = {};
    filteredArticles.forEach((article) => {
      if (!groups[article.category]) {
        groups[article.category] = [];
      }
      groups[article.category].push(article);
    });
    return groups;
  }, [filteredArticles]);

  // If article is selected, show article view
  if (selectedArticle) {
    const category = helpCategories.find((c) => c.id === selectedArticle.category);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container max-w-6xl py-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedArticle(null)}
              className="mb-4 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Button>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <HelpCircle className="h-4 w-4" />
              <span>Help Center</span>
              <ChevronRight className="h-4 w-4" />
              <span>{category?.name}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">{selectedArticle.title}</span>
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="container max-w-4xl py-12">
          <Card className="bg-white shadow-lg border-0">
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <Badge 
                  variant="secondary" 
                  className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-100"
                >
                  <span className="mr-1">{category?.icon}</span>
                  {category?.name}
                </Badge>
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {selectedArticle.title}
                </h1>
              </div>

              <div className="prose prose-lg prose-blue max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:my-4 prose-ul:space-y-2
                prose-li:text-gray-700
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-4
              ">
                <Markdown>{selectedArticle.content}</Markdown>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    Was this article helpful?
                  </h3>
                  <p className="text-sm text-gray-600">
                    If you need additional assistance, please contact your system administrator or support team.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main help center view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                <Book className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How can we help you?
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Search our knowledge base for answers and learn how to use CCMS effectively
            </p>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help articles, guides, and tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 text-lg bg-white shadow-xl border-0 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Category filters */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Browse by Category</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="rounded-full h-11 px-6 shadow-sm"
              size="lg"
            >
              All Topics
            </Button>
            {helpCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full h-11 px-6 shadow-sm"
                size="lg"
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {searchQuery && (
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg">
              Found <span className="font-semibold text-gray-900">{filteredArticles.length}</span> article{filteredArticles.length !== 1 ? "s" : ""} matching your search
            </p>
          </div>
        )}

        {/* Articles grouped by category */}
        {Object.keys(groupedArticles).length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">
                Try different keywords or browse all topics to find what you're looking for.
              </p>
              <Button 
                onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                className="mt-6"
              >
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(groupedArticles).map(([categoryId, articles]) => {
              const category = helpCategories.find((c) => c.id === categoryId);
              if (!category) return null;

              return (
                <div key={categoryId}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-3 shadow-lg">
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-gray-600">{articles.length} article{articles.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article) => (
                      <Card
                        key={article.id}
                        className="group bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md overflow-hidden"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <div className="p-6 h-full flex flex-col">
                          <h3 className="font-semibold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
                            {article.content.substring(0, 150).replace(/[#*]/g, "")}...
                          </p>
                          <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                            Read article
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-20">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 shadow-2xl overflow-hidden">
            <div className="p-12 text-center relative">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-3">Still need help?</h3>
                <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                  Can't find what you're looking for? Contact your system administrator or our technical support team for personalized assistance.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button 
                    onClick={() => setLocation("/")}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg h-12 px-8"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Return to Dashboard
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white/10 h-12 px-8"
                  >
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
