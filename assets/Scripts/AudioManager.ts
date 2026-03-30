import { _decorator, AudioSource, AudioClip, Component, tween, Tween } from 'cc';
import { assetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    private music: AudioSource = null;
    @property(AudioSource)
    private audio: AudioSource = null;

    private bgmClip: AudioClip = null;
    private musicTween: Tween<AudioSource> | null = null;
    private musicBundle: any = null;
    private static _instance: AudioManager | null = null;

    onLoad() {
        if (AudioManager._instance) {
            this.node.destroy();
            return;
        }
        AudioManager._instance = this;

        this.loadBgm();
    }

    /**
     * 加载背景音乐
     */
    private loadBgm(): void {
        assetManager.loadBundle('Music', (err, bundle) => {
            if (err) {
                console.error('加载 Music bundle 失败:', err);
                return;
            }
            this.musicBundle = bundle;

            bundle.load('bgm', AudioClip, (err, clip) => {
                if (err) {
                    console.error('加载 bgm.mp3 失败:', err);
                    return;
                }

                this.bgmClip = clip;
                if (this.music) {
                    this.music.clip = clip;
                    this.music.loop = true;
                    this.music.play();
                }
            });
        });
    }

    /**
     * 播放背景音乐
     */
    public playBgm(): void {
        if (this.music && this.bgmClip) {
            this.music.volume = 1;
            this.music.clip = this.bgmClip;
            this.music.loop = true;
            this.music.play();
        }
    }

    /**
     * 停止背景音乐（逐渐减小音量后停止）
     */
    public stopBgm(): void {
        if (!this.music) return;

        // 停止之前的 tween
        if (this.musicTween) {
            this.musicTween.stop();
            this.musicTween = null;
        }

        // 逐渐减小音量后停止
        this.musicTween = tween(this.music)
            .to(0.5, { volume: 0 }, { easing: 'sineIn' })
            .call(() => {
                this.music.stop();
                this.music.volume = 1;
                this.musicTween = null;
            })
            .start();
    }

    onDestroy() {
        if (AudioManager._instance === this) {
            AudioManager._instance = null;
        }
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): AudioManager | null {
        return AudioManager._instance;
    }

    public static get instance(){
        return AudioManager._instance;
    }

    /**
     * 播放音效
     * @param name 音效文件名（不含扩展名）
     * @param volume 音量，0-1，默认 1
     */
    public playEffect(name: string, volume: number = 1): void {
        if (!this.audio) return;

        const loadAndPlay = (bundle: any) => {
            bundle.load(name, AudioClip, (err: any, clip: AudioClip) => {
                if (err) {
                    console.error(`加载音效 ${name} 失败:`, err);
                    return;
                }
                this.audio.clip = clip;
                this.audio.volume = volume;
                this.audio.play();
            });
        };

        if (this.musicBundle) {
            loadAndPlay(this.musicBundle);
        } else {
            assetManager.loadBundle('Music', (err: any, bundle: any) => {
                if (err) {
                    console.error('加载 Music bundle 失败:', err);
                    return;
                }
                this.musicBundle = bundle;
                loadAndPlay(bundle);
            });
        }
    }
}
