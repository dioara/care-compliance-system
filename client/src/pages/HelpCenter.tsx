import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { helpArticles, helpCategories, type HelpArticle } from "@/data/helpContent";
import { useLocation } from "wouter";

import { MagnifyingGlass, ArrowLeft, CaretRight } from "@phosphor-icons/react";
export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category');
  });

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    let results = helpArticles;

    if (selectedCategory) {
      results = results.filter((article) => article.category === selectedCategory);
    }

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

  // Get popular articles
  const popularArticles = useMemo(() => {
    return helpArticles.filter(a => a.category === "getting-started").slice(0, 4);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Clean header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container max-w-6xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="CCMS" className="h-8 w-8" />
              <span className="font-semibold text-gray-900">CCMS Help Centre</span>
            </div>
            
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>
      </header>

      {/* Hero section - clean and simple */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container max-w-6xl py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              How can we help?
            </h1>
            
            {/* Search bar */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white border-gray-300 rounded-lg focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-10">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className={`cursor-pointer px-4 py-2 text-sm ${
              selectedCategory === null 
                ? "bg-[#1F7AE0] text-white hover:bg-[#1a6bc7]" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            All topics
          </Badge>
          {helpCategories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              className={`cursor-pointer px-4 py-2 text-sm ${
                selectedCategory === category.id 
                  ? "bg-[#1F7AE0] text-white hover:bg-[#1a6bc7]" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Search results count */}
        {searchQuery && (
          <p className="text-gray-600 mb-6">
            Found {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        )}

        {/* Popular articles (when no search/filter) */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {popularArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setLocation(`/help/${article.id}`)}
                  className="text-left p-4 rounded-lg border border-gray-200 hover:border-[#1F7AE0] hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {article.content.substring(0, 100).replace(/[#*]/g, "")}...
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Articles list */}
        {Object.keys(groupedArticles).length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">
              Try different keywords or browse all topics.
            </p>
            <Button 
              onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
              variant="outline"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedArticles).map(([categoryId, articles]) => {
              const category = helpCategories.find((c) => c.id === categoryId);
              if (!category) return null;

              return (
                <div key={categoryId}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {category.name}
                    <span className="text-sm font-normal text-gray-500 ml-2">({articles.length})</span>
                  </h2>
                  
                  <div className="space-y-2">
                    {articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setLocation(`/help/${article.id}`)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#1F7AE0] hover:bg-gray-50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-[#1F7AE0]">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {article.content.substring(0, 100).replace(/[#*]/g, "")}...
                          </p>
                        </div>
                        <CaretRight className="h-5 w-5 text-gray-400 group-hover:text-[#1F7AE0] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
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
