import { _decorator, Component, Node, input, Input, EventTouch, UITransform, Toggle } from 'cc';
import { GameManager, GameState } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('SettingController')
export class SettingController extends Component {

    @property({ type: Node })
    border_bg: Node = null;
    @property({ type: Toggle })
    hand_toggle_left: Toggle = null;
    @property({ type: Toggle })
    hand_toggle_right: Toggle = null;
    @property({ type: Toggle })
    shake_toggle: Toggle = null;

    public lastState: GameState = null;

    start() {
        this.hand_toggle_left?.node.on(Toggle.EventType.TOGGLE, this.onLeftToggleChanged, this);
        this.hand_toggle_right?.node.on(Toggle.EventType.TOGGLE, this.onRightToggleChanged, this);
        this.shake_toggle?.node.on(Toggle.EventType.TOGGLE, this.onShakeToggleChanged, this);
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        this.hand_toggle_left?.node.off(Toggle.EventType.TOGGLE, this.onLeftToggleChanged, this);
        this.hand_toggle_right?.node.off(Toggle.EventType.TOGGLE, this.onRightToggleChanged, this);
        this.shake_toggle?.node.off(Toggle.EventType.TOGGLE, this.onShakeToggleChanged, this);
    }

    /**
     * 左侧切换事件
     */
    private onLeftToggleChanged(toggle: Toggle): void {
        if (toggle.isChecked) {
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.hand_setting = -1;
                gameManager.wxManager.setHandSetting(-1);
            }
        }
    }

    /**
     * 右侧切换事件
     */
    private onRightToggleChanged(toggle: Toggle): void {
        if (toggle.isChecked) {
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.hand_setting = 1;
                gameManager.wxManager.setHandSetting(1);
            }
        }
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

        GameManager.getInstance().gameState = this.lastState;
        // 点击边框外，关闭面板
        this.node.active = false;
    }

    /**
     * 检查点击位置是否在内容面板内
     */
    private isTouchInContentPanel(touchPos: { x: number, y: number }): boolean {

        const contentWorldPos = this.border_bg.getWorldPosition();
        const contentTransform = this.border_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        const halfW = contentTransform.width / 2;
        const halfH = contentTransform.height / 2;

        return touchPos.x >= contentWorldPos.x - halfW && touchPos.x <= contentWorldPos.x + halfW &&
               touchPos.y >= contentWorldPos.y - halfH && touchPos.y <= contentWorldPos.y + halfH;
    }

    /**
     * 震动切换事件
     */
    private onShakeToggleChanged(toggle: Toggle): void {
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.isShake = toggle.isChecked;
            gameManager.wxManager.setShake(toggle.isChecked);
        }
    }
}

