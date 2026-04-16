import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { sendChatMessage } from '@/api/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ChatMessageRole = 'user' | 'bot';

interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  isError?: boolean;
}

const createMessage = (role: ChatMessageRole, text: string, isError = false): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  text,
  isError,
});

const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const trimmedMessage = input.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages(prev => [...prev, createMessage('user', trimmedMessage)]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(trimmedMessage);
      setMessages(prev => [...prev, createMessage('bot', reply)]);
    } catch {
      setMessages(prev => [
        ...prev,
        createMessage(
          'bot',
          "Sorry, I couldn't respond just now. Please check your connection and try again.",
          true,
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const isSendDisabled = !input.trim() || isLoading;

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Chat with us</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-[340px] overflow-y-auto rounded-lg border bg-background p-3 md:h-[420px]"
          aria-label="Chat conversation"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask us anything about our menu, orders, or delivery.
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map(message => (
                <li
                  key={message.id}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm md:max-w-[75%]',
                      message.role === 'user' && 'bg-primary text-primary-foreground',
                      message.role === 'bot' && !message.isError && 'bg-muted text-foreground',
                      message.isError && 'bg-destructive/10 text-destructive',
                    )}
                    aria-label={message.role === 'user' ? 'Your message' : 'Bot message'}
                  >
                    {message.text}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isLoading && (
            <div className="mt-3 flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                Thinking<span className="animate-pulse">...</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor="chatbot-message" className="sr-only">
            Type your message
          </label>
          <Textarea
            id="chatbot-message"
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your message..."
            className="min-h-[90px] resize-y"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSendDisabled} aria-label="Send message">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Chatbot;
