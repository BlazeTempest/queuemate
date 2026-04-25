"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMatch } from '@/lib/MatchContext';
import Image from 'next/image';
import { Send, LogOut, Loader2, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Pusher from 'pusher-js';

export default function ChatRoom() {
  const { activeMatch, endMatch } = useMatch();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  
  // Rating State
  const [showRating, setShowRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!activeMatch?.matchId) {
      setIsLoading(false);
      return;
    }

    let pusher;
    let isMounted = true;

    const initChat = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) return;
        const userData = await userRes.json();
        if (!isMounted) return;
        setUser(userData.user);

        const msgRes = await fetch(`/api/messages?matchId=${activeMatch.matchId}`);
        if (msgRes.ok && isMounted) {
          const msgData = await msgRes.json();
          setMessages(msgData);
        }

        if (!isMounted) return;
        setIsLoading(false);

        pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe(`match-${activeMatch.matchId}`);

        channel.bind('new-message', (message) => {
          setMessages((prev) => [...prev, message]);
        });

        // When the opponent ends the match, show the rating modal!
        channel.bind('match-ended', (data) => {
          toast.info(data.message);
          setShowRating(true); // Open modal instead of redirecting
        });

      } catch (error) {
        console.error("Chat init error:", error);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (pusher) pusher.disconnect();
    };
  }, [activeMatch]); // Removed endMatch & router from dependencies to prevent early redirects

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMatch?.matchId) return;

    const textToSend = newMessage;
    setNewMessage(''); 

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: activeMatch.matchId, text: textToSend })
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleLeaveMatch = async () => {
    if (!activeMatch?.matchId) return;
    setIsEnding(true);

    try {
      await fetch('/api/matches/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: activeMatch.matchId })
      });
      
      toast.success("Match ended.");
      setShowRating(true); // Open modal instead of redirecting
    } catch (error) {
      toast.error("Failed to leave match cleanly.");
      setIsEnding(false);
    }
  };

  // Handle final redirect after rating is done or skipped
  const finishAndRedirect = () => {
    endMatch();
    router.push('/dashboard');
  };

  const submitRating = async () => {
    if (selectedStar === 0) return toast.error("Please select a rating");
    
    setIsSubmittingRating(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: activeMatch.matchId,
          ratedUserId: activeMatch.player.id, // Using your exact schema name
          rating: selectedStar                // Using your exact schema name
        })
      });

      if (res.ok) {
        toast.success(`Rated ${activeMatch.player.username} ${selectedStar} stars!`);
        finishAndRedirect();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit rating");
        finishAndRedirect(); // Still redirect even if it fails (e.g. they already rated)
      }
    } catch (error) {
      toast.error("Network error");
      finishAndRedirect();
    }
  };

  if (!activeMatch) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Users size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">No Active Match</h2>
        <p className="text-muted-foreground text-sm mt-1">Accept an invite or invite a player to start chatting.</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-all hover:bg-primary/90"
        >
          Find Players
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Connecting to Match Room...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-card border border-border rounded-xl overflow-hidden shadow-sm relative">
      
      {/* RATING MODAL (Overlays the chat when match ends) */}
      {showRating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
            
            <Image src={activeMatch.player.avatar || "https://api.dicebear.com/7.x/micah/svg?seed=placeholder"} alt="Opponent" width={80} height={80} className="w-20 h-20 rounded-full bg-secondary object-cover border-4 border-card shadow-lg mb-3" />
            <h3 className="text-xl font-bold text-foreground">Match Finished!</h3>
            <p className="text-sm text-muted-foreground mt-1">How was playing with <span className="text-foreground font-semibold">{activeMatch.player.username}</span>?</p>
            
            <div className="flex gap-2 my-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    size={36} 
                    className={cn(
                      "transition-colors duration-200",
                      (hoveredStar >= star || selectedStar >= star) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                    )} 
                  />
                </button>
              ))}
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button 
                onClick={finishAndRedirect}
                disabled={isSubmittingRating}
                className="flex-1 py-2.5 text-sm font-semibold text-muted-foreground bg-secondary hover:text-foreground rounded-xl transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button 
                onClick={submitRating}
                disabled={isSubmittingRating || selectedStar === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmittingRating ? <Loader2 size={16} className="animate-spin" /> : null}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src={activeMatch.player.avatar || "https://api.dicebear.com/7.x/micah/svg?seed=placeholder"} alt="Opponent" width={40} height={40} className="w-10 h-10 rounded-full bg-secondary object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-card" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{activeMatch.player.username}</h3>
            <p className="text-xs text-muted-foreground font-medium">Playing {activeMatch.player.game}</p>
          </div>
        </div>
        <button 
          onClick={handleLeaveMatch}
          disabled={isEnding || showRating}
          className="flex items-center gap-2 text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive hover:text-white px-4 py-2 rounded-lg transition-all"
        >
          {isEnding ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          Leave Match
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <p className="text-sm text-muted-foreground">Say hi to {activeMatch.player.username}!</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Messages disappear when the match ends.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id || idx} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={showRating}
            placeholder="Type a message..."
            className="w-full bg-secondary border border-border text-foreground text-sm rounded-full pl-5 pr-12 py-3 outline-none focus:border-primary/50 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || showRating}
            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}