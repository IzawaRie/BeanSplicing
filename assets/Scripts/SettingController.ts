import { _decorator, Component, input, Input, EventTouch, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SettingController')
export class SettingController extends Component {
    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 点击边框外任意区域时关闭面板
     */
    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) return;

        // 获取点击位置
        const touchPos = touch.getUILocation();

        // 检查是否点击在内容面板内
        if (this.isTouchInContentPanel(touchPos)) {
            return; // 点击在内容面板内，不关闭
        }

        // 点击边框外，关闭面板
        this.node.active = false;
    }

    /**
     * 检查点击位置是否在内容面板内
     */
    private isTouchInContentPanel(touchPos: { x: number, y: number }): boolean {

        const contentWorldPos = this.node.getWorldPosition();
        const contentTransform = this.node.getComponent(UITransform);
        if (!contentTransform) return false;

        const halfW = contentTransform.width / 2;
        const halfH = contentTransform.height / 2;

        return touchPos.x >= contentWorldPos.x - halfW && touchPos.x <= contentWorldPos.x + halfW &&
               touchPos.y >= contentWorldPos.y - halfH && touchPos.y <= contentWorldPos.y + halfH;
    }
}


