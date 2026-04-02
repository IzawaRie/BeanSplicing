import { _decorator, Component, Label, Node, input, Input, EventTouch, UITransform } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('WindowController')
export class WindowController extends Component {

    @property(Node)
    ad_btn: Node = null;
    @property(Label)
    content: Label = null;
    @property(Node)
    border_bg: Node = null;

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


