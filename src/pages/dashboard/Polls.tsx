import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Loader2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

export default function Polls() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const { data: pollsData, error } = await supabase
        .from("polls")
        .select(`
          *,
          poll_options(*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch vote counts and user votes for each poll
      const pollsWithVotes = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const { data: votes } = await supabase
            .from("poll_votes")
            .select("option_id, user_id")
            .eq("poll_id", poll.id);

          const voteCounts = votes?.reduce((acc, vote) => {
            acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};

          const userVoted = votes?.filter(v => v.user_id === user?.id).map(v => v.option_id) || [];

          return {
            ...poll,
            voteCounts,
            totalVotes: votes?.length || 0,
            userVoted,
            hasVoted: userVoted.length > 0,
          };
        })
      );

      setPolls(pollsWithVotes);

      // Set initial user votes
      const initialVotes: Record<string, string[]> = {};
      pollsWithVotes.forEach(poll => {
        if (poll.userVoted.length > 0) {
          initialVotes[poll.id] = poll.userVoted;
        }
      });
      setUserVotes(initialVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast({
        title: "Error",
        description: "Failed to load polls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string) => {
    const selectedOptions = userVotes[pollId] || [];
    if (selectedOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select an option",
        variant: "destructive",
      });
      return;
    }

    setSubmitting({ ...submitting, [pollId]: true });
    try {
      // Delete existing votes
      await supabase
        .from("poll_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user?.id);

      // Insert new votes
      const votes = selectedOptions.map(optionId => ({
        poll_id: pollId,
        option_id: optionId,
        user_id: user?.id,
      }));

      const { error } = await supabase.from("poll_votes").insert(votes);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });

      fetchPolls();
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setSubmitting({ ...submitting, [pollId]: false });
    }
  };

  const handleOptionChange = (pollId: string, optionId: string, allowMultiple: boolean) => {
    if (allowMultiple) {
      const current = userVotes[pollId] || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      setUserVotes({ ...userVotes, [pollId]: updated });
    } else {
      setUserVotes({ ...userVotes, [pollId]: [optionId] });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Polls
          </h1>
          <p className="text-muted-foreground">
            Participate in polls and share your feedback
          </p>
        </div>

        <div className="grid gap-4">
          {polls.length === 0 ? (
            <Card className="glass-effect border-primary/20">
              <CardContent className="py-8 text-center text-muted-foreground">
                No active polls available
              </CardContent>
            </Card>
          ) : (
            polls.map((poll) => (
              <Card key={poll.id} className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {poll.title}
                    {poll.hasVoted && (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Voted
                      </Badge>
                    )}
                  </CardTitle>
                  {poll.description && (
                    <CardDescription>{poll.description}</CardDescription>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {poll.totalVotes} votes
                    </Badge>
                    {poll.allow_multiple && (
                      <Badge variant="outline">Multiple choice</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {poll.hasVoted ? (
                    // Show results after voting
                    <div className="space-y-3">
                      {poll.poll_options?.map((option: any) => {
                        const votes = poll.voteCounts[option.id] || 0;
                        const percentage = poll.totalVotes > 0 ? (votes / poll.totalVotes) * 100 : 0;
                        const isUserChoice = poll.userVoted.includes(option.id);
                        
                        return (
                          <div key={option.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className={isUserChoice ? "font-semibold text-primary" : ""}>
                                {option.option_text}
                                {isUserChoice && " ✓"}
                              </span>
                              <span className="text-muted-foreground">
                                {votes} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Show voting options
                    <>
                      {poll.allow_multiple ? (
                        <div className="space-y-2">
                          {poll.poll_options?.map((option: any) => (
                            <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50">
                              <Checkbox
                                id={`poll-${poll.id}-option-${option.id}`}
                                checked={(userVotes[poll.id] || []).includes(option.id)}
                                onCheckedChange={() => handleOptionChange(poll.id, option.id, true)}
                              />
                              <Label
                                htmlFor={`poll-${poll.id}-option-${option.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                {option.option_text}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <RadioGroup
                          value={(userVotes[poll.id] || [])[0]}
                          onValueChange={(value) => handleOptionChange(poll.id, value, false)}
                        >
                          {poll.poll_options?.map((option: any) => (
                            <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50">
                              <RadioGroupItem value={option.id} id={`poll-${poll.id}-option-${option.id}`} />
                              <Label
                                htmlFor={`poll-${poll.id}-option-${option.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                {option.option_text}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      <Button
                        onClick={() => handleVote(poll.id)}
                        disabled={submitting[poll.id] || !userVotes[poll.id]?.length}
                        className="premium-button w-full"
                      >
                        {submitting[poll.id] && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Submit Vote
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}