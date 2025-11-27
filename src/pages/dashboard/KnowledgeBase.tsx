import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, Eye, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
  views: number;
  helpful: number;
  not_helpful: number;
  created_at: string;
}

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
  };

  const incrementViews = async (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    try {
      await supabase
        .from("knowledge_base")
        .update({ views: (article.views || 0) + 1 })
        .eq("id", articleId);
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handleFeedback = async (articleId: string, isHelpful: boolean) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    try {
      const updateData = isHelpful
        ? { helpful: (article.helpful || 0) + 1 }
        : { not_helpful: (article.not_helpful || 0) + 1 };

      const { error } = await supabase
        .from("knowledge_base")
        .update(updateData)
        .eq("id", articleId);

      if (error) throw error;
      
      setArticles(articles.map(a => 
        a.id === articleId 
          ? { ...a, ...updateData }
          : a
      ));
      
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    incrementViews(article.id);
  };

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (selectedArticle) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedArticle(null)}>
            ← Back to articles
          </Button>
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary">{selectedArticle.category}</Badge>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedArticle.views} views
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
              </div>
              
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="border-t border-border/50 pt-6">
                <p className="text-sm text-muted-foreground mb-3">Was this article helpful?</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, true)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Yes ({selectedArticle.helpful})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, false)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    No ({selectedArticle.not_helpful})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">Browse helpful articles and guides</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-border/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.length === 0 ? (
            <Card className="glass-strong border-border/50 col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No articles found</p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="glass-strong border-border/50 cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50"
                onClick={() => openArticle(article)}
              >
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {article.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {article.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {article.helpful}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
