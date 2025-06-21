import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Send, Bot, MapPin, Cloud, Settings, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  agentType?: 'tourist' | 'weather' | 'supervisor';
  content: string;
  timestamp: Date;
}

export default function AgentChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Travel Supervisor initialized',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '2',
      type: 'agent',
      agentType: 'tourist',
      content: 'Hello! I\'m your Tourist Agent. I can help you discover amazing places to visit. Just tell me where you\'d like to explore!',
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
    },
    {
      id: '3',
      type: 'agent',
      agentType: 'weather',
      content: 'Hi there! I\'m your Weather Agent. I can provide real-time weather information and forecasts for any location you\'re planning to visit.',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
    },
  ]);
  
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    try {
      const response = await fetch('/api/agents/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage,
          agentType: 'supervisor',
        }),
      });

      if (response.ok) {
        // Simulate agent responses
        setTimeout(() => {
          const agentResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'agent',
            agentType: 'supervisor',
            content: `I've received your message: "${newMessage}". Let me coordinate with the appropriate agents to help you with this request.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, agentResponse]);
          setIsTyping(false);
          
          // Simulate follow-up from specific agent
          setTimeout(() => {
            const followUpAgent = newMessage.toLowerCase().includes('weather') ? 'weather' : 'tourist';
            const followUpMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'agent',
              agentType: followUpAgent,
              content: followUpAgent === 'weather' 
                ? 'I can help you with weather information! Please share the location you\'re interested in, and I\'ll provide current conditions and forecasts.'
                : 'I\'d be happy to suggest tourist attractions! Share your location or area of interest, and I\'ll find the best spots to visit.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, followUpMessage]);
          }, 1500);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'tourist':
        return <MapPin className="h-2 w-2 text-white icon1" />;
      case 'weather':
        return <Cloud className="h-2 w-2 text-white icon3" />;
      case 'supervisor':
        return <Bot className="h-2 w-2 text-white icon2" />;
      default:
        return <Bot className="h-2 w-2 text-white icon4" />;
    }
  };

  const getAgentColor = (agentType?: string) => {
    switch (agentType) {
      case 'tourist':
        return 'bg-primary';
      case 'weather':
        return 'bg-secondary';
      case 'supervisor':
        return 'bg-gray-600';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary icon5" />
            AI Travel Agents
          </CardTitle>
          <Button size="sm" variant="ghost">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">Your personal travel assistants</p>
        
        {/* Agent Status */}
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-gray-700">3 agents active</span>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">Tourist</Badge>
            <Badge variant="outline" className="text-xs">Weather</Badge>
            <Badge variant="outline" className="text-xs">Supervisor</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Chat Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 animate-slide-up ${
              message.type === 'user' ? 'flex-row-reverse' : ''
            }`}>
              {message.type === 'system' ? (
                <div className="w-full text-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    {message.content}
                  </Badge>
                </div>
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' ? 'bg-gray-600' : getAgentColor(message.agentType)
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      getAgentIcon(message.agentType)
                    )}
                  </div>
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {message.type === 'user' 
                          ? (user?.firstName || 'You')
                          : `${message.agentType === 'tourist' ? 'Tourist' : 
                               message.agentType === 'weather' ? 'Weather' : 
                               'Supervisor'} Agent`
                        }
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className={`rounded-xl px-4 py-3 text-sm max-w-xs ${
                      message.type === 'user' 
                        ? 'bg-primary text-white ml-auto' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white icon5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">Supervisor Agent</span>
                  <span className="text-xs text-gray-500">typing...</span>
                </div>
                <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="agent-thinking">Analyzing your request</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask me anything about your travel plans..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isTyping}
              className="button-primary button-primary:hover/90 transition-all shadow-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
