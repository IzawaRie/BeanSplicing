import { _decorator, Component, Label, Sprite, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressController')
export class ProgressController extends Component {
    @property({ type: Sprite })
    private progress: Sprite = null;
    @property({ type: Label })
    private progress_label: Label = null;

    private per01Duration: number = 0.1;
    private currentTween: Tween<Sprite> = null;

    /**
     * 设置进度 (0-1)
     */
    setProgress(value: number, callback?: () => void): void {
        if (!this.progress) return;

        const targetValue = Math.max(0, Math.min(1, value));
        const startValue = this.progress.fillRange;
        const diff = targetValue - startValue;

        if (Math.abs(diff) < 0.001) {
            // 差异太小，直接完成
            if (this.progress_label) {
                this.progress_label.string = `${Math.floor(targetValue * 100)}%`;
            }
            callback?.();
            return;
        }

        // 计算动画时长：每0.1进度需要per01Duration秒
        const duration = Math.abs(diff) / 0.1 * this.per01Duration;

        // 停止之前的 tween
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }

        // 记录目标百分比
        const labelTarget = Math.floor(targetValue * 100);

        // 使用 tween 直接驱动 progress
        this.currentTween = tween(this.progress)
            .to(duration, { fillRange: targetValue }, { easing: 'smooth' })
            .call(() => {
                this.currentTween = null;
                if (this.progress_label) {
                    this.progress_label.string = `${labelTarget}%`;
                }
                callback?.();
            })
            .start();
    }

    /**
     * 每帧调用，用于实时更新 label
     */
    update(dt: number): void {
        if (!this.currentTween || !this.progress || !this.progress_label) {
            return;
        }

        // 每帧检查并更新 label
        const currentPercent = Math.floor(this.progress.fillRange * 100);
        this.progress_label.string = `${currentPercent}%`;
    }

    /**
     * 立即设置进度（无动画）
     */
    setProgressImmediate(value: number): void {
        // 停止任何进行中的动画
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }

        if (this.progress) {
            this.progress.fillRange = Math.max(0, Math.min(1, value));
        }
        // 立即更新 progress_label
        const percent = Math.floor(Math.max(0, Math.min(1, value)) * 100);
        if (this.progress_label) {
            this.progress_label.string = `${percent}%`;
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
