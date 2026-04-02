import { _decorator, Component, Label, Node, input, Input, EventTouch, UITransform } from 'cc';
import { GameManager } from './GameManager';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('WindowController')
export class WindowController extends Component {

    @property(Node)
    ad_btn: Node = null;
    @property(Label)
    content: Label = null;
    @property(Node)
    border_bg: Node = null;

    start() {
        if (this.ad_btn) {
            this.ad_btn.on(Node.EventType.TOUCH_END, this.onAdBtnClick, this);
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
                gameManager.power++;
                // 更新 power_label
                const menuManager = gameManager.menuManager;
                if (menuManager?.power_label) {
                    menuManager.power_label.string = `${gameManager.power}`;
                }
                // 关闭窗口
                this.closeWindow();
            }
        });
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
     * 检查点击位置是否在内容面板内
     */
    private isTouchInContentPanel(touchPos: { x: number, y: number }): boolean {
        if (!this.border_bg) return false;

        const contentWorldPos = this.border_bg.getWorldPosition();
        const contentTransform = this.border_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        const halfW = contentTransform.width / 2;
        const halfH = contentTransform.height / 2;

        return touchPos.x >= contentWorldPos.x - halfW && touchPos.x <= contentWorldPos.x + halfW &&
               touchPos.y >= contentWorldPos.y - halfH && touchPos.y <= contentWorldPos.y + halfH;
    }
}


