import { _decorator, Component, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressController')
export class ProgressController extends Component {
    @property({ type: Sprite })
    private progress: Sprite = null;

    /**
     * 设置进度 (0-1)
     */
    setProgress(value: number): void {
        if (this.progress) {
            // fillRange 从 0 到 1
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
