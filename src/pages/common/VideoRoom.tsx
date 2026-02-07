import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    Maximize2, Share2, Users, Loader2, Monitor, Minimize2, Link, Copy, RefreshCw
} from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { agoraService } from '@/lib/AgoraService';
import {
    getOrCreateVideoRoom, updateVideoRoomStatus,
    setRoomParticipant, removeRoomParticipant
} from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { toast } from 'sonner';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

export default function VideoRoom() {
    const { appointmentId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const profile = useProfile();
    const [joined, setJoined] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const localStreamRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<HTMLDivElement>(null);

    const isInitializing = useRef(false);

    useEffect(() => {
        const init = async () => {
            // Prevent double-initialization in Strict Mode
            if (!appointmentId || !profile?.uid || isInitializing.current) return;

            try {
                isInitializing.current = true;
                setLoading(true);
                console.log('[VideoRoom] Initializing session...', appointmentId);

                await getOrCreateVideoRoom(appointmentId);

                // Track availability of multiple cameras
                const cameras = await agoraService.getCameras();
                setHasMultipleCameras(cameras.length > 1);

                // Announce self in Firestore
                await setRoomParticipant(appointmentId, profile.uid, profile.fullName || t('videoRoom.user'));

                await agoraService.join(appointmentId, profile.uid);

                agoraService.onUserPublished(async (user, mediaType) => {
                    console.log('[VideoRoom] Remote user published:', user.uid, mediaType);
                    await agoraService.subscribe(user, mediaType);
                    if (mediaType === 'video') {
                        setRemoteUsers(prev => {
                            if (prev.find(u => u.uid === user.uid)) return prev;
                            return [...prev, user];
                        });
                    }
                });

                agoraService.onUserUnpublished((user) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                });

                setJoined(true);
                setLoading(false);

                setTimeout(() => {
                    agoraService.playLocalVideo('local-video');
                }, 100);

            } catch (error) {
                console.error('[VideoRoom] Init failed:', error);
                setLoading(false);
                isInitializing.current = false;
            }
        };

        const setupSync = () => {
            if (!appointmentId) return;
            const q = query(collection(db, 'videoRooms', appointmentId, 'participants'));
            return onSnapshot(q, (snapshot) => {
                const names: Record<string, string> = {};
                snapshot.forEach(doc => {
                    names[doc.id] = doc.data().fullName;
                });
                setParticipantNames(names);
            });
        };

        init();
        const unsubscribe = setupSync();

        return () => {
            if (isInitializing.current) {
                console.log('[VideoRoom] Cleaning up session');
                if (appointmentId && profile?.uid) {
                    removeRoomParticipant(appointmentId, profile.uid);
                }
                agoraService.leave();
                isInitializing.current = false;
            }
            unsubscribe?.();
        };
    }, [appointmentId, profile?.uid]);

    // Handle remote video playback whenever users list changes
    useEffect(() => {
        remoteUsers.forEach(user => {
            if (user.videoTrack) {
                const containerId = `remote-video-${user.uid}`;
                const element = document.getElementById(containerId);
                if (element) {
                    user.videoTrack.play(containerId);
                }
            }
        });
    }, [remoteUsers]);

    const toggleMic = () => {
        setMicEnabled(!micEnabled);
        agoraService.toggleMicrophone(!micEnabled);
    };

    const toggleVideo = () => {
        setVideoEnabled(!videoEnabled);
        agoraService.toggleCamera(!videoEnabled);
    };

    const toggleScreenShare = async () => {
        try {
            if (screenSharing) {
                await agoraService.stopScreenShare();
                setScreenSharing(false);
                // Camera automatically resumes in AgoraService
            } else {
                await agoraService.startScreenShare();
                setScreenSharing(true);
                // Hide camera state since screen sharing unpublishes it
                setVideoEnabled(false);
            }
        } catch (e) {
            console.error("Screen share toggle failed:", e);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            roomRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const flipCamera = async () => {
        try {
            await agoraService.switchCamera();
            toast.success(t('videoRoom.cameraSwitched'));
        } catch (e) {
            toast.error(t('videoRoom.switchFailed'));
        }
    };

    const endCall = () => {
        navigate(-1);
    };

    const copyRoomLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            toast.success(t('videoRoom.linkCopied'));
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-background flex flex-col items-center justify-center text-foreground z-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium ring-pulse">{t('videoRoom.joining')}</p>
            </div>
        );
    }

    const participantCount = remoteUsers.length + 1;

    // Professional Responsive Grid Layout - Optimized for Mobile Viewport Fitting
    const getGridClasses = () => {
        if (participantCount === 1) return 'grid-cols-1 max-w-5xl';
        if (participantCount === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
        if (participantCount <= 4) return 'grid-cols-2 max-w-full h-fit self-center';
        if (participantCount <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-full h-fit self-center';
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-full h-fit self-center';
    };

    return (
        <div ref={roomRef} className="fixed inset-0 bg-background flex flex-col z-50 transition-all duration-500 overflow-hidden font-sans select-none touch-none">
            {/* Header Info */}
            <div className="absolute top-4 md:top-6 left-4 md:left-6 right-4 md:right-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2 md:gap-3 bg-card/80 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-border shadow-sm">
                    <div className="h-1.5 md:h-2 w-1.5 md:w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-foreground text-[11px] md:text-sm font-medium">{t('videoRoom.live')}</span>
                    <div className="h-3 md:h-4 w-px bg-border mx-0.5 md:mx-1" />
                    <span className="text-muted-foreground text-[10px] md:text-xs">ID: {appointmentId?.slice(-6)}</span>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 bg-card/80 backdrop-blur-xl px-2.5 md:px-3 py-1.5 md:py-2 rounded-full border border-border shadow-sm">
                    <Users className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
                    <span className="text-foreground text-[10px] md:text-xs">{participantCount}</span>
                </div>
            </div>

            {/* Video Grid */}
            <div className={`flex-1 px-3 md:px-6 pt-16 md:pt-24 pb-28 md:pb-32 grid gap-2 md:gap-4 place-items-center w-full h-full max-h-[100dvh] overflow-hidden transition-all duration-700 ${getGridClasses()}`}>
                {/* Local Video */}
                <div className="relative w-full h-full bg-black/40 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group transition-all duration-500 hover:ring-2 ring-primary/50 flex items-center justify-center min-h-0 aspect-[4/3] md:aspect-auto">
                    <div id="local-video" className="w-full h-full object-contain transform scale-x-[-1]" />
                    {(!videoEnabled && !screenSharing) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                            <div className="h-16 md:h-24 w-16 md:w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl md:text-3xl font-bold ring-4 ring-primary/10">
                                {profile?.fullName?.charAt(0)}
                            </div>
                        </div>
                    )}
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 flex gap-2">
                        <div className="bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 md:gap-2">
                            <div className={`h-1 md:h-1.5 w-1 md:w-1.5 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-white text-[9px] md:text-[10px] uppercase tracking-wider font-bold truncate max-w-[80px] md:max-w-none">{t('videoRoom.you')}</span>
                            {screenSharing && <Monitor className="h-2.5 md:h-3 w-2.5 md:w-3 text-primary" />}
                        </div>
                    </div>
                </div>

                {/* Remote Videos */}
                {remoteUsers.map((user) => (
                    <div key={user.uid} className="relative w-full h-full bg-black/40 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group transition-all duration-500 hover:ring-2 ring-primary/50 flex items-center justify-center min-h-0 aspect-[4/3] md:aspect-auto">
                        <div id={`remote-video-${user.uid}`} className="w-full h-full object-contain" />
                        <div className="absolute top-2 md:top-4 left-2 md:left-4">
                            <div className="bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 md:gap-2">
                                <div className="h-1 md:h-1.5 w-1 md:w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-white text-[9px] md:text-[10px] uppercase tracking-wider font-bold truncate max-w-[80px] md:max-w-none">
                                    {participantNames[user.uid] || t('videoRoom.user')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Immersive Controls */}
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 bg-card/80 backdrop-blur-3xl px-4 md:px-6 py-3 md:py-4 rounded-[3rem] border border-border shadow-2xl z-30 transition-all hover:bg-card">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMic}
                    className={`h-10 md:h-12 w-10 md:w-12 rounded-full transition-all duration-300 ${micEnabled ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-red-500/80 text-white hover:bg-red-500'}`}
                >
                    {micEnabled ? <Mic className="h-4 md:h-5 w-4 md:w-5" /> : <MicOff className="h-4 md:h-5 w-4 md:w-5" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVideo}
                    disabled={screenSharing}
                    className={`h-10 md:h-12 w-10 md:w-12 rounded-full transition-all duration-300 ${videoEnabled ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-red-500/80 text-white hover:bg-red-500'} ${screenSharing ? 'opacity-50 grayscale' : ''}`}
                >
                    {videoEnabled ? <Video className="h-4 md:h-5 w-4 md:w-5" /> : <VideoOff className="h-4 md:h-5 w-4 md:w-5" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyRoomLink}
                    title={t('videoRoom.copyLink')}
                    className="h-10 md:h-12 w-10 md:w-12 rounded-full bg-muted text-foreground hover:bg-muted/80"
                >
                    <Copy className="h-4 md:h-5 w-4 md:w-5" />
                </Button>

                <div className="h-6 md:h-8 w-px bg-border mx-0.5 md:mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleScreenShare}
                    className={`h-10 md:h-12 w-10 md:w-12 rounded-full transition-all duration-300 ${screenSharing ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                >
                    <Share2 className="h-4 md:h-5 w-4 md:w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-10 md:h-12 w-10 md:w-12 rounded-full bg-muted text-foreground hover:bg-muted/80 hidden md:flex"
                >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>

                {(hasMultipleCameras && videoEnabled) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={flipCamera}
                        className="h-10 md:h-12 w-10 md:w-12 rounded-full bg-muted text-foreground hover:bg-muted/80"
                    >
                        <RefreshCw className="h-4 md:h-5 w-4 md:w-5" />
                    </Button>
                )}

                <div className="h-6 md:h-8 w-px bg-border mx-0.5 md:mx-1" />

                <Button
                    onClick={endCall}
                    className="h-12 md:h-14 w-12 md:w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all hover:scale-110 active:scale-95 border-none p-0"
                >
                    <PhoneOff className="h-5 md:h-6 w-5 md:w-6 text-white" />
                </Button>
            </div>

            {/* Subtle Background Glow */}
            <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -z-10" />

            {/* Background Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] z-[-5] overflow-hidden">
                <img
                    src="/logo.png"
                    alt="Watermark"
                    className="w-[300px] md:w-[600px] h-[300px] md:h-[600px] object-contain grayscale"
                />
            </div>
        </div>
    );
}
