import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Book, ArrowLeft, Home, ChevronRight, HelpCircle, Clock, TrendingUp } from "lucide-react";
import { helpArticles, helpCategories, type HelpArticle } from "@/data/helpContent";
import { useLocation } from "wouter";

export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    // Read category from URL params on mount
    const params = new URLSearchParams(window.location.search);
    return params.get('category');
  });

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

  // Get popular articles (first 3 from getting started)
  const popularArticles = useMemo(() => {
    return helpArticles.filter(a => a.category === "getting-started").slice(0, 3);
  }, []);

  // Main help center view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Header with improved design */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <div className="container relative py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            {/* Icon with glow effect */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full"></div>
                <div className="relative bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-2xl">
                  <Book className="h-14 w-14" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Help Center
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
              Find answers, learn features, and get the most out of your Care Compliance Management System
            </p>

            {/* Enhanced search bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-2xl"></div>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Search for help articles, guides, and tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-16 pr-6 h-16 text-lg bg-white shadow-2xl border-0 rounded-2xl focus:ring-4 focus:ring-white/30 transition-all"
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-10 text-blue-100">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                <span className="text-sm font-medium">{helpArticles.length} Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">{helpCategories.length} Categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-16">
        {/* Popular Articles Section */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-16">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 text-sm font-semibold">
                POPULAR
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Quick Start Guides</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Get up and running quickly with these essential guides
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {popularArticles.map((article, index) => {
                const category = helpCategories.find((c) => c.id === article.category);
                return (
                  <Card
                    key={article.id}
                    className="group bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden"
                    onClick={() => setLocation(`/help/${article.id}`)}
                  >
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-100 text-indigo-600 rounded-xl p-3">
                          <span className="text-2xl">{category?.icon}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs font-semibold">
                          #{index + 1}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-3 mb-6 leading-relaxed">
                        {article.content.substring(0, 120).replace(/[#*]/g, "")}...
                      </p>
                      <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read guide
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSelectedCategory("getting-started")}
                className="hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                View all Getting Started articles
              </Button>
            </div>
          </div>
        )}

        {/* Category Navigation */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browse by Topic</h2>
            <p className="text-gray-600 text-lg">
              Explore articles organized by feature and topic
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="h-auto py-4 px-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Book className="h-6 w-6" />
                <span className="font-semibold">All Topics</span>
                <span className="text-xs opacity-70">{helpArticles.length} articles</span>
              </div>
            </Button>
            
            {helpCategories.map((category) => {
              const count = helpArticles.filter(a => a.category === category.id).length;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-auto py-4 px-6 rounded-xl shadow-sm hover:shadow-md transition-all"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-semibold text-sm">{category.name}</span>
                    <span className="text-xs opacity-70">{count} articles</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        {searchQuery && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-full px-6 py-3">
              <Search className="h-5 w-5 text-blue-600" />
              <p className="text-gray-700 font-medium">
                Found <span className="font-bold text-blue-600">{filteredArticles.length}</span> article{filteredArticles.length !== 1 ? "s" : ""} matching "{searchQuery}"
              </p>
            </div>
          </div>
        )}

        {/* Articles grouped by category */}
        {Object.keys(groupedArticles).length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 max-w-lg mx-auto">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No articles found</h3>
              <p className="text-gray-600 text-lg mb-8">
                We couldn't find any articles matching your search. Try different keywords or browse all topics.
              </p>
              <Button 
                onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                size="lg"
                className="h-12 px-8"
              >
                Clear Search & Browse All
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-20">
            {Object.entries(groupedArticles).map(([categoryId, articles]) => {
              const category = helpCategories.find((c) => c.id === categoryId);
              if (!category) return null;

              return (
                <div key={categoryId}>
                  {/* Category header */}
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-gray-200">
                    <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg">
                      <span className="text-3xl">{category.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-1">{category.name}</h2>
                      <p className="text-gray-600 font-medium">
                        {articles.length} article{articles.length !== 1 ? "s" : ""} • {category.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Articles grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article) => (
                      <Card
                        key={article.id}
                        className="group bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden h-full"
                        onClick={() => setLocation(`/help/${article.id}`)}
                      >
                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:h-2 transition-all"></div>
                        <div className="p-7 flex flex-col h-full">
                          <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-grow leading-relaxed">
                            {article.content.substring(0, 140).replace(/[#*]/g, "")}...
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
                              Read more
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <Clock className="h-4 w-4 text-gray-400" />
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

        {/* Footer CTA with improved design */}
        <div className="mt-24">
          <Card className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white border-0 shadow-2xl overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            <div className="relative p-16 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <HelpCircle className="h-8 w-8" />
                </div>
                <h3 className="text-4xl font-bold mb-4">Still need assistance?</h3>
                <p className="text-blue-100 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
                  Can't find the answer you're looking for? Our support team is here to help you get the most out of CCMS.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button 
                    onClick={() => setLocation("/")}
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-blue-50 shadow-xl h-14 px-10 text-base font-semibold"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Return to Dashboard
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm h-14 px-10 text-base font-semibold"
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
