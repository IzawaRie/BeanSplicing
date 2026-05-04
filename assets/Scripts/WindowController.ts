import { _decorator, Component, Label, Node, input, Input, EventTouch, UITransform, Vec2 } from 'cc';
import { GameManager } from './GameManager';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('WindowController')
export class WindowController extends Component {

    @property(Node)
    ad_btn: Node = null;
    @property(Node)
    close_btn: Node = null;
    @property(Label)
    content: Label = null;
    @property(Node)
    border_bg: Node = null;

    start() {
        if (this.ad_btn) {
            this.ad_btn.on(Node.EventType.TOUCH_END, this.onAdBtnClick, this);
        }
        if (this.close_btn) {
            this.close_btn.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.isWindowOpen = true;
        }
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.isWindowOpen = false;
        }
    }

    onDestroy() {
        if (this.ad_btn) {
            this.ad_btn.off(Node.EventType.TOUCH_END, this.onAdBtnClick, this);
        }
        if (this.close_btn) {
            this.close_btn.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
    }

    /**
     * 广告按钮点击事件
     */
    private onAdBtnClick(): void {
        const gameManager = GameManager.getInstance();
        gameManager?.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 播放激励视频广告
        WXManager.instance.showRewardedVideoAd((success) => {
            if (success) {
                // 观看成功后增加体力
                gameManager.power += 3;
                // 关闭窗口
                this.closeWindow();
            }
        });
    }

    private onCloseBtnClick(): void {
        const gameManager = GameManager.getInstance();
        gameManager?.vibrateShort();
        AudioManager.instance.playEffect('click_btn');
        this.closeWindow();
    }

    /**
     * 点击边框外任意区域时关闭面板
     */
    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) return;

        const touchPos = touch.getUILocation();

        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closeWindow();
    }

    /**
     * 关闭窗口
     */
    public closeWindow(): void {
        this.node.active = false;
    }

    /**
     * 打开窗口并显示提示文字
     * @param message 提示文字
     * @param showAdBtn 是否显示广告按钮，默认 true
     */
    public showWithMessage(message: string, showAdBtn: boolean = true): void {
        if (this.content) {
            this.content.string = message;
            this.content.node.setPosition(75, showAdBtn ? 22 : -15);
        }
        if (this.ad_btn) {
            this.ad_btn.active = showAdBtn;
        }
        this.node.active = true;
    }

    /**
     * 检查点击位置是否在内容面板内
     */
    private isTouchInContentPanel(touchPos: Vec2): boolean {
        if (!this.border_bg) return false;

        const contentTransform = this.border_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
    }
}
