import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Send,
  User,
  Search,
  MoreVertical,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Users,
  Paperclip,
  Mic,
  Phone,
  Video,
  FileText,
  X,
  Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
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
import { sendMessage, getOrCreateChat, getPatientsForDoctor } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DoctorChat() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get('chatId');
  const profile = useAuthStore(s => s.profile);

  const [chats, setChats] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

    // We removed orderBy to avoid index requirement for now
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', profile.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(`Doctor Chat: Received ${snapshot.size} chats`);
      const chatList = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherParticipantId = data.participants.find((id: string) => id !== profile.uid);

        let otherUser: any = { fullName: t('videoRoom.user') };
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

  // Fetch Patients List
  useEffect(() => {
    const fetchPatients = async () => {
      if (!profile?.uid || activeTab !== 'patients') return;
      setLoadingPatients(true);
      try {
        const data = await getPatientsForDoctor(profile.uid);
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients for chat:', error);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [profile?.uid, activeTab]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], "voice_note.webm", { type: 'audio/webm' });
        setAttachment(audioFile);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error(t('chatPage.micError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !activeChatId || !profile?.uid) return;

    setSending(true);
    try {
      let fileUrl = undefined;
      let type: 'text' | 'image' | 'audio' | 'file' = 'text';

      if (attachment) {
        const uploadResult = await uploadToCloudinary(attachment, { folder: 'telemedicine/chat' });
        fileUrl = uploadResult.secureUrl;

        if (attachment.type.startsWith('image/')) type = 'image';
        else if (attachment.type.startsWith('audio/')) type = 'audio';
        else type = 'file';
      }

      await sendMessage(activeChatId, profile.uid, messageText, type, fileUrl);

      setMessageText('');
      setAttachment(null);
    } catch (error) {
      console.error(error);
      toast.error(t('chatPage.sendError'));
    } finally {
      setSending(false);
    }
  };

  const startPatientChat = async (patientId: string) => {
    if (!profile?.uid) return;
    try {
      setLoading(true);
      const chatId = await getOrCreateChat(profile.uid, patientId);
      setSearchParams({ chatId });
      setActiveTab('chats');
    } catch (error) {
      toast.error(t('chatPage.startChatError'));
      setLoading(false);
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-muted">
                <TabsTrigger value="chats" className="text-xs gap-2">
                  <MessageSquare className="h-3 w-3" />
                  {t('chatPage.chats')}
                </TabsTrigger>
                <TabsTrigger value="patients" className="text-xs gap-2">
                  <Users className="h-3 w-3" />
                  {t('chatPage.patients')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chats' ? (
              loading ? (
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
                        "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/20",
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
                          {chat.otherUser?.role === 'patient' ? t('roles.patient') : t('chatPage.healthcareColleague')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">{t('chatPage.noActiveChats')}</p>
                  <Button variant="link" onClick={() => setActiveTab('patients')} className="text-primary text-xs mt-2">
                    {t('chatPage.messagePatient')}
                  </Button>
                </div>
              )
            ) : (
              // Patients Tab
              loadingPatients ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : patients.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {patients.map((p) => (
                    <button
                      key={p.uid}
                      onClick={() => startPatientChat(p.uid)}
                      className="w-full flex items-center gap-3 p-4 text-start transition-colors hover:bg-secondary/20"
                    >
                      <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback>{p.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{t('chatPage.clickToMessage')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">{t('chatPage.noPatientsFound')}</p>
                </div>
              )
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
              {/* Window Header */}
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
                    <p className="text-xs text-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> {t('chatPage.online')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                    <Video className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        if (activeChat.otherUser?.role === 'patient') {
                          window.location.href = `/doctor/patients/${activeChat.otherUser.uid}`;
                        }
                      }}>
                        <User className="h-4 w-4 me-2" /> {t('chatPage.viewProfile')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                  const isOwn = msg.senderId === profile?.uid;
                  return (
                    <div
                      key={msg.id || idx}
                      className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", isOwn ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[75%] lg:max-w-md rounded-2xl px-4 py-2.5 shadow-sm space-y-2",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                          : "bg-muted/50 text-foreground rounded-tl-none border border-border/50 shadow-sm"
                      )}>
                        {/* Image Attachment */}
                        {msg.type === 'image' && msg.fileUrl && (
                          <div className="rounded-xl overflow-hidden mb-1">
                            <img src={msg.fileUrl} alt="Attachment" className="max-w-full h-auto object-cover" />
                          </div>
                        )}

                        {/* File Attachment */}
                        {msg.type === 'file' && msg.fileUrl && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors">
                            <FileText className="h-8 w-8 opacity-70" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate underline">{t('chatPage.downloadFile')}</p>
                            </div>
                          </a>
                        )}

                        {/* Audio Attachment */}
                        {msg.type === 'audio' && msg.fileUrl && (
                          <div className="flex items-center gap-2">
                            <audio controls src={msg.fileUrl} className="h-8 max-w-[200px]" />
                          </div>
                        )}

                        {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}

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

              {/* Window Footer */}
              <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md">
                {attachment && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-background border border-border rounded-lg max-w-fit">
                    <span className="text-xs truncate max-w-[150px]">{attachment.name}</span>
                    <button onClick={() => setAttachment(null)} className="text-destructive hover:bg-destructive/10 rounded-full p-1"><X className="h-3 w-3" /></button>
                  </div>
                )}
                {isRecording && (
                  <div className="flex items-center gap-2 mb-2 text-destructive animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-xs font-bold">{t('chatPage.recording')}</span>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex gap-1">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button type="button" variant="ghost" size="icon" className="hover:bg-primary/10 text-muted-foreground hover:text-primary" onClick={() => document.getElementById('file-upload')?.click()}>
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn("hover:bg-destructive/10 hover:text-destructive", isRecording && "text-destructive bg-destructive/10")}
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      // Touch events for mobile
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t('chatPage.typeMessage')}
                    className="flex-1 input-glow h-11"
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={(!messageText.trim() && !attachment) || sending} className="btn-gradient px-4 h-11">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pulse">
              <div className="p-8 rounded-full bg-primary/5 border border-primary/10">
                <MessageSquare className="h-16 w-16 text-primary/20" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground/50">{t('chatPage.yourConversations')}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  {t('chatPage.selectChatDesc')}
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout >
  );
}
