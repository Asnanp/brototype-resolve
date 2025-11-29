import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, MessageCircle, X, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const StudentAIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant for the complaint system. How can I help you today? I can guide you through filing complaints, explain processes, or answer any questions you have!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: assistantMessage };
                return newMsgs;
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI assistant');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    streamChat(input.trim());
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-16 w-16 rounded-full bg-gradient-to-r from-primary via-primary-glow to-secondary shadow-lg hover:shadow-primary/50 glow group"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </Button>
      </motion.div>
    );
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          size="lg"
          className="h-14 px-6 rounded-full bg-gradient-to-r from-primary via-primary-glow to-secondary shadow-lg hover:shadow-primary/50 glow gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">AI Assistant</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
    >
      <Card className="glass-strong border-primary/30 shadow-xl glow">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              AI Assistant
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea ref={scrollRef} className="h-[400px] p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-primary-glow text-white'
                        : 'glass border border-border/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass border border-border/50 p-3 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="glass border-border/50"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
                className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
