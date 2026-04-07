import { _decorator, AudioSource, AudioClip, Component, tween, Tween } from 'cc';
import { assetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    private music: AudioSource = null;

    private bgmClip: AudioClip = null;
    private gameBgmClip: AudioClip = null;
    private musicTween: Tween<AudioSource> | null = null;
    private musicBundle: any = null;
    private static _instance: AudioManager | null = null;

    // 音乐和音效开关
    private _isMusicEnabled: boolean = true;
    private _isAudioEnabled: boolean = true;

    // 音效 AudioSource 池（循环使用，避免打断正在播放的音效）
    private effectPool: AudioSource[] = [];
    private poolIndex: number = 0;
    private readonly POOL_SIZE: number = 5;

    onLoad() {
        if (AudioManager._instance) {
            this.node.destroy();
            return;
        }
        AudioManager._instance = this;

        // 创建音效池
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const source = this.addComponent(AudioSource);
            source.playOnAwake = false;
            this.effectPool.push(source);
        }

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
        });
    }

    /**
     * 播放菜单背景音乐（bgm）
     */
    public playMenuBgm(): void {
        if (!this.music) return;

        if (this.bgmClip) {
            this.playBgmClip(this.bgmClip);
            return;
        }

        // bundle 还没加载完，先加载 bundle 再播放
        if (!this.musicBundle) {
            assetManager.loadBundle('Music', (err, bundle) => {
                if (err) {
                    console.error('加载 Music bundle 失败:', err);
                    return;
                }
                this.musicBundle = bundle;
                this.playMenuBgm(); // 重新调用，这次 bundle 已就绪
            });
            return;
        }

        this.musicBundle.load('bgm', AudioClip, (err, clip) => {
            if (err) {
                console.error('加载 bgm 失败:', err);
                return;
            }
            this.bgmClip = clip;
            this.playBgmClip(clip);
        });
    }

    /**
     * 播放游戏背景音乐（game_bgm）
     */
    public playGameBgm(): void {
        if (!this.music) return;

        if (this.gameBgmClip) {
            this.playBgmClip(this.gameBgmClip);
            return;
        }

        // bundle 还没加载完，先加载 bundle 再播放
        if (!this.musicBundle) {
            assetManager.loadBundle('Music', (err, bundle) => {
                if (err) {
                    console.error('加载 Music bundle 失败:', err);
                    return;
                }
                this.musicBundle = bundle;
                this.playGameBgm(); // 重新调用，这次 bundle 已就绪
            });
            return;
        }

        this.musicBundle.load('game_bgm', AudioClip, (err, clip) => {
            if (err) {
                console.error('加载 game_bgm 失败:', err);
                return;
            }
            this.gameBgmClip = clip;
            this.playBgmClip(clip);
        });
    }

    /**
     * 内部方法：播放音频片段
     */
    private playBgmClip(clip: AudioClip): void {
        if (this.music.playing) {
            this.music.stop();
        }
        this.music.clip = clip;
        this.music.loop = true;
        this.music.volume = this._isMusicEnabled ? 1 : 0;
        this.music.play();
    }

    /**
     * 停止背景音乐
     */
    public stopBgm(): void {
        if (!this.music) return;

        if (this.musicTween) {
            this.musicTween.stop();
            this.musicTween = null;
        }

        this.musicTween = tween(this.music)
            .to(0.5, { volume: 0 }, { easing: 'sineIn' })
            .call(() => {
                this.music.stop();
                this.music.volume = this._isMusicEnabled ? 1 : 0;
                this.musicTween = null;
            })
            .start();
    }

    /**
     * 暂停背景音乐
     */
    public pauseBgm(): void {
        if (this.music && this.music.playing) {
            this.music.pause();
        }
    }

    /**
     * 继续播放背景音乐（从暂停处继续）
     */
    public resumeBgm(): void {
        if (this.music && !this.music.playing) {
            this.music.play();
        }
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
     * 播放音效（使用池，不会打断正在播放的同音效）
     * @param name 音效文件名（不含扩展名）
     * @param volume 音量，0-1，默认 1
     */
    public playEffect(name: string, volume: number = 1): void {
        if (!this._isAudioEnabled) return;

        const loadAndPlay = (bundle: any) => {
            bundle.load(name, AudioClip, (err: any, clip: AudioClip) => {
                if (err) {
                    console.error(`加载音效 ${name} 失败:`, err);
                    return;
                }
                // 从池中取一个 AudioSource，循环使用
                const source = this.effectPool[this.poolIndex];
                this.poolIndex = (this.poolIndex + 1) % this.POOL_SIZE;
                source.clip = clip;
                source.volume = volume;
                source.play();
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

    /**
     * 设置音乐开关
     */
    public setMusicEnabled(isEnabled: boolean): void {
        this._isMusicEnabled = isEnabled;
        if (this.music) {
            this.music.volume = isEnabled ? 1 : 0;
        }
    }

    /**
     * 获取音乐开关状态
     */
    public isMusicEnabled(): boolean {
        return this._isMusicEnabled;
    }

    /**
     * 设置音效开关
     */
    public setAudioEnabled(isEnabled: boolean): void {
        this._isAudioEnabled = isEnabled;
    }

    /**
     * 获取音效开关状态
     */
    public isAudioEnabled(): boolean {
        return this._isAudioEnabled;
    }
}
