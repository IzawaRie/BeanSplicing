import { _decorator, Color, Component, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { GameManager } from './GameManager';
import { ShopDisplayItem } from './ShopConfig';
import { AudioManager } from './AudioManager';
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
    private _currentData: ShopDisplayItem | null = null;
    private _canPurchase: boolean = false;

    start() {
        this.captureBaseSpriteSize();
        this.item_btn?.on(Node.EventType.TOUCH_END, this.onItemBtnClick, this);
    }

    update(deltaTime: number) {
        
    }

    public setData(data: ShopDisplayItem | null): void {
        this._loadToken++;
        this.captureBaseSpriteSize();
        this._currentData = data;

        if (!data) {
            this.node.active = false;
            if (this.item_sp) {
                this.item_sp.spriteFrame = null;
            }
            this._canPurchase = false;
            return;
        }

        this.node.active = true;
        this.refreshPurchaseState(data);
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

    onDestroy() {
        this.item_btn?.off(Node.EventType.TOUCH_END, this.onItemBtnClick, this);
    }

    private onItemBtnClick(): void {
        if (!this._currentData || this._currentData.isPurchased || !this._canPurchase) {
            return;
        }

        AudioManager.instance.playEffect('click_btn');
        GameManager.getInstance()?.shop?.purchaseShopItem(this._currentData);
    }

    private refreshPurchaseState(data: ShopDisplayItem): void {
        const currentCoins = GameManager.getInstance()?.coinCount ?? 0;
        this._canPurchase = !data.isPurchased && currentCoins >= data.price;
        const targetColor = this._canPurchase
            ? new Color(255, 255, 255, 255)
            : new Color(200, 200, 200, 255);

        const buttonSprite = this.item_btn?.getComponent(Sprite);
        if (buttonSprite) {
            buttonSprite.color = targetColor;
        }

        if (this.item_btn) {
            for (const child of this.item_btn.children) {
                const label = child.getComponent(Label);
                if (label) {
                    label.color = targetColor;
                }
            }
        }
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
