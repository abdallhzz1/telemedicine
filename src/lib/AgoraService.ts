import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID, AGORA_TOKEN } from './agora';

export class AgoraService {
    private client: IAgoraRTCClient;
    private localAudioTrack: IMicrophoneAudioTrack | null = null;
    private localVideoTrack: ICameraVideoTrack | null = null;
    private localScreenTrack: any = null; // Can be [localVideoTrack, localAudioTrack] or just localVideoTrack

    constructor() {
        this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }

    async join(channelName: string, uid: string | number): Promise<void> {
        console.log(`[AgoraService] Attempting to join channel: ${channelName} with UID: ${uid}`);
        try {
            await this.client.join(AGORA_APP_ID, channelName, AGORA_TOKEN, uid);
            console.log('[AgoraService] Join success');

            const tracksToPublish = [];

            // Create and publish local tracks (Best effort)
            try {
                console.log('[AgoraService] Creating local audio track...');
                this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                tracksToPublish.push(this.localAudioTrack);
                console.log('[AgoraService] Audio track created');
            } catch (e) {
                console.warn('[AgoraService] No microphone found or permission denied');
            }

            try {
                console.log('[AgoraService] Creating local video track...');
                this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
                tracksToPublish.push(this.localVideoTrack);
                console.log('[AgoraService] Video track created');
            } catch (e) {
                console.warn('[AgoraService] No camera found or permission denied');
            }

            if (tracksToPublish.length > 0) {
                await this.client.publish(tracksToPublish);
                console.log(`[AgoraService] Published ${tracksToPublish.length} local tracks`);
            }
        } catch (error) {
            console.error('[AgoraService] Error joining channel:', error);
            throw error;
        }
    }

    async leave(): Promise<void> {
        console.log('[AgoraService] Leaving channel...');
        this.localAudioTrack?.stop();
        this.localAudioTrack?.close();
        this.localVideoTrack?.stop();
        this.localVideoTrack?.close();
        if (this.localScreenTrack) {
            if (Array.isArray(this.localScreenTrack)) {
                this.localScreenTrack.forEach(t => { t.stop(); t.close(); });
            } else {
                this.localScreenTrack.stop();
                this.localScreenTrack.close();
            }
        }
        await this.client.leave();
        console.log('[AgoraService] Left channel');
    }

    async startScreenShare(): Promise<void> {
        try {
            this.localScreenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");

            // If we're publishing video, we need to unpublish it first
            if (this.localVideoTrack) {
                await this.client.unpublish(this.localVideoTrack);
            }

            await this.client.publish(this.localScreenTrack);

            // Automatically stop if the user stops sharing via browser UI
            const track = Array.isArray(this.localScreenTrack) ? this.localScreenTrack[0] : this.localScreenTrack;
            track.on("track-ended", () => {
                this.stopScreenShare();
            });
        } catch (e) {
            console.error('[AgoraService] Screen share failed:', e);
            throw e;
        }
    }

    async stopScreenShare(): Promise<void> {
        if (!this.localScreenTrack) return;

        await this.client.unpublish(this.localScreenTrack);
        if (Array.isArray(this.localScreenTrack)) {
            this.localScreenTrack.forEach(t => t.close());
        } else {
            this.localScreenTrack.close();
        }
        this.localScreenTrack = null;

        // Resume camera if it was on
        if (this.localVideoTrack) {
            await this.client.publish(this.localVideoTrack);
        }
    }

    playScreenShare(containerId: string) {
        const track = Array.isArray(this.localScreenTrack) ? this.localScreenTrack[0] : this.localScreenTrack;
        track?.play(containerId);
    }

    async switchCamera(): Promise<void> {
        if (!this.localVideoTrack) return;

        try {
            const devices = await AgoraRTC.getCameras();
            if (devices.length < 2) {
                console.warn('[AgoraService] Only one camera found, cannot switch.');
                return;
            }

            const currentDeviceId = this.localVideoTrack.getMediaStreamTrack().getSettings().deviceId;
            const nextDevice = devices.find(d => d.deviceId !== currentDeviceId) || devices[0];

            await this.localVideoTrack.setDevice(nextDevice.deviceId);
            console.log('[AgoraService] Switched camera to:', nextDevice.label);
        } catch (e) {
            console.error('[AgoraService] Camera switch failed:', e);
            throw e;
        }
    }

    async getCameras() {
        return await AgoraRTC.getCameras();
    }

    onUserPublished(callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void) {
        this.client.on('user-published', callback);
    }

    onUserUnpublished(callback: (user: IAgoraRTCRemoteUser) => void) {
        this.client.on('user-unpublished', callback);
    }

    async subscribe(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') {
        await this.client.subscribe(user, mediaType);
        if (mediaType === 'video') {
            user.videoTrack?.play(`remote-video-${user.uid}`);
        }
        if (mediaType === 'audio') {
            user.audioTrack?.play();
        }
    }

    playLocalVideo(containerId: string) {
        this.localVideoTrack?.play(containerId);
    }

    toggleMicrophone(enabled: boolean) {
        this.localAudioTrack?.setEnabled(enabled);
    }

    toggleCamera(enabled: boolean) {
        this.localVideoTrack?.setEnabled(enabled);
    }

    getClient() {
        return this.client;
    }
}

export const agoraService = new AgoraService();
