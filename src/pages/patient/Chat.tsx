import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Send,
    Search,
    MoreVertical,
    MessageSquare,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import {
    collection,
    query,
    where,
    onSnapshot,
    limit,
    doc,
    getDoc,
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendMessage } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PatientChat() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get('chatId');
    const profile = useAuthStore(s => s.profile);

    const [chats, setChats] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [activeChat, setActiveChat] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch Conversations List
    useEffect(() => {
        if (!profile?.uid) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', profile.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            console.log(`Patient Chat: Received ${snapshot.size} chats`);
            const chatList = await Promise.all(snapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();
                const otherParticipantId = data.participants.find((id: string) => id !== profile.uid);

                let otherUser: any = { fullName: t('chatPage.healthcareProvider') };
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
                    if (userDoc.exists()) otherUser = userDoc.data();
                } catch (e) { }

                return {
                    id: chatDoc.id,
                    ...data,
                    otherUser
                };
            }));

            setChats(chatList);
            setLoading(false);

            if (activeChatId) {
                const current = chatList.find(c => c.id === activeChatId);
                if (current) setActiveChat(current);
            }
        });

        return () => unsubscribe();
    }, [profile?.uid, activeChatId]);

    // Fetch Messages for Active Chat
    useEffect(() => {
        if (!activeChatId) {
            setMessages([]);
            setActiveChat(null);
            return;
        }

        const q = query(
            collection(db, 'chats', activeChatId, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [activeChatId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChatId || !profile?.uid) return;

        const text = messageText;
        setMessageText('');
        setSending(true);
        try {
            await sendMessage(activeChatId, profile.uid, text);
        } catch (error) {
            toast.error(t('chatPage.sendError'));
        } finally {
            setSending(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-120px)] gap-6">
                {/* Sidebar */}
                <GlassCard className={cn(
                    "w-full lg:w-80 flex flex-col p-0 overflow-hidden shrink-0",
                    activeChatId && "hidden lg:flex"
                )}>
                    <div className="p-4 border-b border-border/50 bg-background/50">
                        <h2 className="text-xl font-bold mb-4">{t('nav.chat')}</h2>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={t('chatPage.searchProviders')} className="ps-10 h-9 input-glow text-sm" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : chats.length > 0 ? (
                            <div className="divide-y divide-border/30">
                                {chats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSearchParams({ chatId: chat.id })}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-4 text-start transition-colors hover:bg-secondary/20",
                                            activeChatId === chat.id && "bg-primary/10 border-e-2 border-primary"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 border border-primary/20">
                                            <AvatarImage src={chat.otherUser?.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {chat.otherUser?.fullName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-semibold truncate text-sm">{chat.otherUser?.fullName}</span>
                                                {chat.lastMessageAt && (
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {format(chat.lastMessageAt.toDate(), 'HH:mm')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {chat.otherUser?.specialization || t('chatPage.healthcareProvider')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm">{t('chatPage.noConsultations')}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Chat Window */}
                <GlassCard className={cn(
                    "flex-1 flex flex-col p-0 overflow-hidden relative",
                    !activeChatId && "hidden lg:flex items-center justify-center text-muted-foreground bg-secondary/5"
                )}>
                    {activeChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="lg:hidden"
                                        onClick={() => setSearchParams({})}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Avatar className="h-10 w-10 border border-primary/20">
                                        <AvatarImage src={activeChat.otherUser?.avatar} />
                                        <AvatarFallback>{activeChat.otherUser?.fullName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold leading-none mb-1">{activeChat.otherUser?.fullName}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 italic">
                                            {activeChat.otherUser?.specialization || t('chatPage.professional')}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, idx) => {
                                    const isOwn = msg.senderId === profile?.uid;
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
                                        >
                                            <div className={cn(
                                                "max-w-[75%] lg:max-w-md rounded-2xl px-4 py-2.5 shadow-sm",
                                                isOwn
                                                    ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                                                    : "bg-muted/50 text-foreground rounded-tl-none border border-border/50 shadow-sm"
                                            )}>
                                                <p className="text-sm min-w-0 break-words">{msg.text}</p>
                                                <p className={cn(
                                                    "text-[9px] mt-1 text-end opacity-60",
                                                    isOwn ? "text-primary-foreground" : "text-muted-foreground"
                                                )}>
                                                    {msg.createdAt && format(msg.createdAt.toDate(), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md">
                                <div className="flex gap-2">
                                    <Input
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder={t('chatPage.typeMessage')}
                                        className="flex-1 input-glow h-11"
                                        autoComplete="off"
                                    />
                                    <Button type="submit" disabled={!messageText.trim() || sending} className="btn-gradient px-4 h-11">
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pulse text-center p-8">
                            <div className="p-8 rounded-full bg-primary/5 border border-primary/10">
                                <MessageSquare className="h-16 w-16 text-primary/20" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground/50">{t('chatPage.yourConversations')}</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                    {t('chatPage.selectChatDesc')}
                                </p>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </DashboardLayout>
    );
}
