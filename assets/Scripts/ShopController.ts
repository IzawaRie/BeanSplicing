import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ShopController')
export class ShopController extends Component {
    @property({ type: Node })
    shop_tag1: Node = null;

    @property({ type: Node })
    shop_tag2: Node = null;

    @property({ type: Node })
    shop_tag3: Node = null;

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Node })
    shop_items: Node[] = [];

    @property({ type: Label })
    coin_label: Label = null;

    start() {
        this.bindButtonEvents();
    }

    update(deltaTime: number) {
        
    }

    onDestroy() {
        this.unbindButtonEvents();
    }

    private bindButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
    }

    private unbindButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
    }

    private onCloseBtnClick(): void {
        this.node.active = false;
    }
}


