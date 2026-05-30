import { useState, useRef, useEffect } from "react";
import { 
  useListOpenaiConversations, 
  useGetOpenaiConversation, 
  useListOpenaiMessages,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Terminal, 
  Shield, 
  Database, 
  Cpu, 
  Plus, 
  Trash2,
  Send,
  Bot,
  User,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MODES = [
  { id: "general", label: "General AI", icon: MessageSquare },
  { id: "infrastructure", label: "Infrastructure Expert", icon: Database },
  { id: "devops", label: "DevOps Expert", icon: Terminal },
  { id: "architect", label: "Software Architect", icon: Cpu },
  { id: "security", label: "Security Analyst", icon: Shield },
];

export default function Copilot() {
  const queryClient = useQueryClient();
  const [selectedMode, setSelectedMode] = useState("general");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: messages = [] } = useListOpenaiMessages(activeConvId as number, { query: { enabled: !!activeConvId } });
  
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const handleNewChat = () => {
    createConv.mutate({ data: { title: "New Conversation", mode: selectedMode } }, {
      onSuccess: (data) => {
        setActiveConvId(data.id);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        if (activeConvId === id) setActiveConvId(null);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    let convId = activeConvId;
    if (!convId) {
      const conv = await createConv.mutateAsync({ data: { title: input.substring(0, 30) + "...", mode: selectedMode } });
      convId = conv.id;
      setActiveConvId(conv.id);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    const currentInput = input;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically add user message (will be replaced by refetch later)
    queryClient.setQueryData(
      ["/api/openai/conversations", convId, "messages"], 
      (old: any) => [...(old || []), { id: Date.now(), role: "user", content: currentInput, createdAt: new Date().toISOString() }]
    );

    try {
      const token = getToken();
      const res = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: currentInput, mode: selectedMode })
      });

      if (!res.ok) throw new Error("Stream failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr.trim() === "[DONE]") continue; // Standard OpenAI SSE done
              
              try {
                const data = JSON.parse(dataStr);
                if (data.done) break;
                if (data.content) {
                  setStreamingContent(prev => prev + data.content);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      // Refresh messages to get the persisted versions
      queryClient.invalidateQueries({ queryKey: ["/api/openai/conversations", convId, "messages"] });
    }
  };

  return (
    <div className="flex h-full bg-[#0a0f1e]">
      {/* Sidebar */}
      <div className="w-72 border-r border-border/50 flex flex-col bg-card/30 backdrop-blur-xl">
        <div className="p-4 border-b border-border/50">
          <Button onClick={handleNewChat} className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50" data-testid="button-new-chat">
            <Plus className="h-4 w-4 mr-2" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${
                  activeConvId === conv.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'
                }`}
                data-testid={`conv-${conv.id}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate text-foreground/80">{conv.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Mode Selector */}
        <div className="h-14 border-b border-border/50 flex items-center px-4 gap-2 bg-card/20 backdrop-blur-md z-10">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedMode === mode.id 
                  ? 'bg-secondary/20 text-secondary border border-secondary/50' 
                  : 'text-muted-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              <mode.icon className="h-3.5 w-3.5" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {(!messages.length && !isStreaming) ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <div className="h-16 w-16 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">How can I help you optimize your infrastructure?</h2>
              <div className="grid grid-cols-2 gap-4 max-w-2xl mt-8">
                {["Analyze current latency spikes", "Suggest database scaling strategy", "Explain recent error rate trend", "Review security group policies"].map(prompt => (
                  <Card key={prompt} className="p-4 bg-card/30 hover:bg-white/5 cursor-pointer border-border/50 transition-colors" onClick={() => setInput(prompt)}>
                    <p className="text-sm text-foreground/80">{prompt}</p>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg: any) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {isStreaming && (
                <MessageBubble role="assistant" content={streamingContent} isStreaming />
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-card/20 backdrop-blur-md border-t border-border/50">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot anything..."
              className="w-full bg-card/50 border-border/50 h-14 pl-4 pr-14 text-base focus-visible:ring-secondary rounded-xl"
              data-testid="input-chat"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 h-10 w-10 bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/50 rounded-lg"
              data-testid="button-send-chat"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, isStreaming = false }: { role: string, content: string, isStreaming?: boolean }) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex gap-4 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
        isUser ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-secondary/20 border-secondary/50 text-secondary'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
        isUser 
          ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 text-white' 
          : 'bg-card/60 backdrop-blur-md border border-border/50'
      }`}>
        {content ? (
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-1 h-6">
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>
    </div>
  );
}
