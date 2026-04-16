import { _decorator, Component, Label, Node, Sprite, input, Input, EventTouch, UITransform, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChartController')
export class ChartController extends Component {
    @property({ type: Node })
    simple_tag: Node = null;

    @property({ type: Node })
    medium_tag: Node = null;

    @property({ type: Node })
    hard_tag: Node = null;

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Sprite })
    owner_avatar_sprite: Sprite = null;

    @property({ type: Label })
    owner_name_label: Label = null;

    @property({ type: Label })
    owner_number_label: Label = null;

    @property({ type: Label })
    owner_level_label: Label = null;

    @property({ type: Node })
    content: Node = null;

    @property({ type: Node })
    chart_bg: Node = null;

    onLoad() {
        if (this.close_btn) {
            this.close_btn.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) return;

        const touchPos = touch.getUILocation();
        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closeChart();
    }

    private isTouchInContentPanel(touchPos: Vec2): boolean {
        if (!this.chart_bg) return false;

        const contentTransform = this.chart_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
    }

    private onCloseBtnClick(): void {
        this.closeChart();
    }

    private closeChart(): void {
        this.node.active = false;
    }

    onDestroy() {
        if (this.close_btn) {
            this.close_btn.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
    }
}
