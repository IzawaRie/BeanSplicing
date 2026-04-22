import { _decorator, Component, Label, Node, resources, Sprite, SpriteFrame } from 'cc';
import { ShopDisplayItem } from './ShopConfig';
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

    private _loadToken: number = 0;

    start() {

    }

    update(deltaTime: number) {
        
    }

    public setData(data: ShopDisplayItem | null): void {
        this._loadToken++;

        if (!data) {
            this.node.active = false;
            if (this.item_sp) {
                this.item_sp.spriteFrame = null;
            }
            return;
        }

        this.node.active = true;
        if (this.item_name) {
            this.item_name.string = data.name;
        }
        if (this.item_price) {
            this.item_price.string = `${data.price}`;
        }

        if (!this.item_sp || !data.imagePath) {
            return;
        }

        const loadToken = this._loadToken;
        resources.load(`${data.imagePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (loadToken !== this._loadToken || !this.item_sp) {
                return;
            }

            if (err || !spriteFrame) {
                this.item_sp.spriteFrame = null;
                return;
            }

            this.item_sp.spriteFrame = spriteFrame;
        });
    }
}
