import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Book, ArrowLeft, Home } from "lucide-react";
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container max-w-4xl py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Center
          </Button>

          {/* Article content */}
          <Card className="p-8">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                {helpCategories.find((c) => c.id === selectedArticle.category)?.name}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900">{selectedArticle.title}</h1>
            </div>

            <div className="prose prose-blue max-w-none">
              <Markdown>{selectedArticle.content}</Markdown>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Was this article helpful? Contact your administrator if you need additional assistance.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main help center view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Book className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to your questions and learn how to use CCMS effectively
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            All Topics
          </Button>
          {helpCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full"
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Results count */}
        {searchQuery && (
          <div className="text-center mb-6">
            <p className="text-gray-600">
              Found {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Articles grouped by category */}
        {Object.keys(groupedArticles).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No articles found matching your search. Try different keywords or browse all topics.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedArticles).map(([categoryId, articles]) => {
              const category = helpCategories.find((c) => c.id === categoryId);
              if (!category) return null;

              return (
                <div key={categoryId}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="mr-3 text-3xl">{category.icon}</span>
                    {category.name}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map((article) => (
                      <Card
                        key={article.id}
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {article.content.substring(0, 150)}...
                        </p>
                        <Button variant="link" className="mt-4 p-0 h-auto">
                          Read more →
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-blue-50 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Contact your system administrator or technical support team for additional assistance.
            </p>
            <Button onClick={() => setLocation("/")}>
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
