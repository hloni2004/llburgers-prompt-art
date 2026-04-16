import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { sendChatMessage } from '@/api/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
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

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const isSendDisabled = !input.trim() || isLoading;

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-24 right-4 z-[60] md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-3 flex h-[420px] w-[min(calc(100vw-2rem),370px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            aria-label="Support chat"
          >
            <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
              <h2 className="text-sm font-semibold">Support Chat</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div
              className="flex-1 overflow-y-auto bg-background px-3 py-3"
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
                          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm',
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
                    Typing<span className="animate-pulse">...</span>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3">
              <label htmlFor="chatbot-message" className="sr-only">
                Type your message
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="chatbot-message"
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type your message..."
                  autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isSendDisabled} aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-shadow hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default Chatbot;
