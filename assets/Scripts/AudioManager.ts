import { _decorator, AudioSource, AudioClip, Component } from 'cc';
import { assetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    private music: AudioSource = null;
    @property(AudioSource)
    private audio: AudioSource = null;

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

            bundle.load('bgm', AudioClip, (err, clip) => {
                if (err) {
                    console.error('加载 bgm.mp3 失败:', err);
                    return;
                }

                if (this.music) {
                    this.music.clip = clip;
                    this.music.loop = true;
                    this.music.play();
                }
            });
        });
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
}
