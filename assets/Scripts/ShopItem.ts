import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ShopItem')
export class ShopItem extends Component {
    @property({ type: Node })
    item_btn: Node = null;

    @property({ type: Node })
    item_ban: Node = null;

    @property({ type: Sprite })
    item_sp: Sprite = null;

    @property({ type: Label })
    item_name: Label = null;

    @property({ type: Label })
    item_price: Label = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}


