import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Loader2, ThumbsUp, ThumbsDown, MessageSquare, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SatisfactionSurveyProps {
  complaintId: string;
  userId: string;
  onComplete: () => void;
}

export function SatisfactionSurvey({ complaintId, userId, onComplete }: SatisfactionSurveyProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [responseTimeRating, setResponseTimeRating] = useState(0);
  const [resolutionQualityRating, setResolutionQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState("");

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("satisfaction_surveys").insert({
        complaint_id: complaintId,
        user_id: userId,
        overall_rating: overallRating,
        response_time_rating: responseTimeRating || null,
        resolution_quality_rating: resolutionQualityRating || null,
        communication_rating: communicationRating || null,
        feedback_text: feedbackText || null,
        would_recommend: wouldRecommend,
        suggestions: suggestions || null,
      });

      if (error) throw error;

      // Also update the complaint's satisfaction_rating
      await supabase
        .from("complaints")
        .update({ 
          satisfaction_rating: overallRating,
          status: "closed",
          closed_at: new Date().toISOString()
        })
        .eq("id", complaintId);

      toast.success("Thank you for your detailed feedback!");
      onComplete();
    } catch (error: any) {
      toast.error("Failed to submit survey", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-all hover:scale-110 ${
              star <= value ? "text-warning" : "text-muted-foreground/30 hover:text-warning/50"
            }`}
          >
            <Star className={`w-7 h-7 ${star <= value ? "fill-current" : ""}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 && ["Poor", "Fair", "Good", "Very Good", "Excellent"][value - 1]}
        </span>
      </div>
    </div>
  );

  return (
    <Card className="glass-strong border-primary/30 glow overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary-glow/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Satisfaction Survey
          </CardTitle>
          <CardDescription>
            Your complaint has been resolved! Help us improve by sharing your experience.
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <StarRating
                value={overallRating}
                onChange={setOverallRating}
                label="Overall Experience *"
              />
              
              <div className="grid md:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl glass border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    Response Time
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setResponseTimeRating(star)}
                        className={`p-0.5 transition-all ${
                          star <= responseTimeRating ? "text-warning" : "text-muted-foreground/30"
                        }`}
                      >
                        <Star className={`w-5 h-5 ${star <= responseTimeRating ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl glass border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Resolution Quality
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setResolutionQualityRating(star)}
                        className={`p-0.5 transition-all ${
                          star <= resolutionQualityRating ? "text-warning" : "text-muted-foreground/30"
                        }`}
                      >
                        <Star className={`w-5 h-5 ${star <= resolutionQualityRating ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl glass border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="w-4 h-4 text-info" />
                    Communication
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommunicationRating(star)}
                        className={`p-0.5 transition-all ${
                          star <= communicationRating ? "text-warning" : "text-muted-foreground/30"
                        }`}
                      >
                        <Star className={`w-5 h-5 ${star <= communicationRating ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={overallRating === 0}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label>Would you recommend our complaint system to others?</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    className={`flex-1 gap-2 ${wouldRecommend === true ? "bg-success hover:bg-success/90" : ""}`}
                    onClick={() => setWouldRecommend(true)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Yes, definitely!
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === false ? "default" : "outline"}
                    className={`flex-1 gap-2 ${wouldRecommend === false ? "bg-destructive hover:bg-destructive/90" : ""}`}
                    onClick={() => setWouldRecommend(false)}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Not really
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Tell us about your experience (optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What did we do well? What could we improve?"
                  className="min-h-[100px] glass border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestions">Any suggestions for improvement? (optional)</Label>
                <Textarea
                  id="suggestions"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="We value your ideas for making our system better..."
                  className="min-h-[80px] glass border-border/50"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
