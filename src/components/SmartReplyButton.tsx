import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartReplyButtonProps {
  complaintTitle: string;
  complaintDescription: string;
  category?: string;
  onReplyGenerated: (reply: string) => void;
}

export const SmartReplyButton = ({
  complaintTitle,
  complaintDescription,
  category,
  onReplyGenerated,
}: SmartReplyButtonProps) => {
  const [generating, setGenerating] = useState(false);

  const generateSmartReply = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-smart-reply', {
        body: {
          complaintTitle,
          complaintDescription,
          category,
        },
      });

      if (error) throw error;

      if (data?.smartReply) {
        onReplyGenerated(data.smartReply);
        toast.success('Smart reply generated!');
      }
    } catch (error: any) {
      console.error('Error generating smart reply:', error);
      toast.error('Failed to generate smart reply', {
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generateSmartReply}
      disabled={generating}
      className="gap-2 bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/30 hover:border-primary/50"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          AI Smart Reply
        </>
      )}
    </Button>
  );
};
