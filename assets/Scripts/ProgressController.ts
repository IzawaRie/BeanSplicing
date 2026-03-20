import { _decorator, Component, Sprite, tween, Tween, TweenEasing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressController')
export class ProgressController extends Component {
    @property({ type: Sprite })
    private progress: Sprite = null;

    private per01Duration: number = 0.1;

    // 缓动类型
    @property({ type: String })
    easingType: string = 'smooth';

    private currentTween: Tween<Sprite> = null;

    /**
     * 设置进度 (0-1)
     */
    setProgress(value: number, callback?: () => void): void {
        if (!this.progress) return;

        const targetValue = Math.max(0, Math.min(1, value));
        const currentValue = this.progress.fillRange;
        const diff = targetValue - currentValue;

        if (Math.abs(diff) < 0.001) {
            // 差异太小，直接完成
            if (callback) callback();
            return;
        }

        // 计算动画时长：每0.1进度需要per01Duration秒
        const duration = Math.abs(diff) / 0.1 * this.per01Duration;

        // 停止之前的 tween
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }

        // 使用 tween 平滑过渡
        this.currentTween = tween(this.progress)
            .to(duration, { fillRange: targetValue }, { easing: 'smooth' })
            .call(() => {
                this.currentTween = null;
                if (callback) {
                    callback();
                }
            })
            .start();
    }

    /**
     * 立即设置进度（无动画）
     */
    setProgressImmediate(value: number): void {
        if (this.progress) {
            this.progress.fillRange = Math.max(0, Math.min(1, value));
        }
    }

    /**
     * 获取进度 (0-1)
     */
    getProgress(): number {
        if (this.progress) {
            return Math.abs(this.progress.fillRange);
        }
        return 0;
    }
}
