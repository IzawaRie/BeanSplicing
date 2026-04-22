import { _decorator, Component, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
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
    private _baseSpriteWidth: number = 0;
    private _baseSpriteHeight: number = 0;

    start() {
        this.captureBaseSpriteSize();
    }

    update(deltaTime: number) {
        
    }

    public setData(data: ShopDisplayItem | null): void {
        this._loadToken++;
        this.captureBaseSpriteSize();

        if (!data) {
            this.node.active = false;
            if (this.item_sp) {
                this.item_sp.spriteFrame = null;
            }
            return;
        }

        this.node.active = true;
        if (this.item_ban) {
            this.item_ban.active = data.isPurchased === true;
        }
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
            this.applySpriteAspectRatio(spriteFrame);
        });
    }

    private applySpriteAspectRatio(spriteFrame: SpriteFrame): void {
        if (!this.item_sp?.node) {
            return;
        }

        const uiTransform = this.item_sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        const { width: sourceWidth, height: sourceHeight } = spriteFrame.originalSize;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            return;
        }

        this.item_sp.sizeMode = Sprite.SizeMode.CUSTOM;
        const baseWidth = this._baseSpriteWidth > 0 ? this._baseSpriteWidth : uiTransform.width;
        const baseHeight = this._baseSpriteHeight > 0 ? this._baseSpriteHeight : uiTransform.height;
        const aspectRatio = sourceWidth / sourceHeight;

        let targetWidth = baseWidth;
        let targetHeight = baseHeight;

        if (baseWidth > 0 && baseHeight > 0) {
            const baseRatio = baseWidth / baseHeight;
            if (baseRatio > aspectRatio) {
                targetWidth = baseHeight * aspectRatio;
            } else {
                targetHeight = baseWidth / aspectRatio;
            }
        } else if (baseHeight > 0) {
            targetWidth = baseHeight * aspectRatio;
        } else if (baseWidth > 0) {
            targetHeight = baseWidth / aspectRatio;
        } else {
            targetWidth = sourceWidth;
            targetHeight = sourceHeight;
        }

        uiTransform.setContentSize(targetWidth, targetHeight);
    }

    private captureBaseSpriteSize(): void {
        if (!this.item_sp?.node) {
            return;
        }

        const uiTransform = this.item_sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        if (this._baseSpriteWidth <= 0) {
            this._baseSpriteWidth = uiTransform.width;
        }
        if (this._baseSpriteHeight <= 0) {
            this._baseSpriteHeight = uiTransform.height;
        }
    }
}
