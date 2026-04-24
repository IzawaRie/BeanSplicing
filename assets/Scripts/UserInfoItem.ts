import { _decorator, Component, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UserInfoItem')
export class UserInfoItem extends Component {
    @property({ type: Node })
    item_sp: Node = null;

    @property({ type: Node })
    item_selected: Node = null;

    private _loadToken: number = 0;
    private _baseSpriteWidth: number = 0;
    private _baseSpriteHeight: number = 0;

    start(): void {
        this.captureBaseSpriteSize();
    }

    public setData(imagePath: string, selected: boolean): void {
        this._loadToken++;
        this.setSelected(selected);
        this.captureBaseSpriteSize();

        const sprite = this.item_sp?.getComponent(Sprite) ?? null;
        if (!sprite) {
            return;
        }

        const safeImagePath = (imagePath || '').trim();
        if (!safeImagePath) {
            sprite.spriteFrame = null;
            return;
        }

        const loadToken = this._loadToken;
        resources.load(`${safeImagePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (loadToken !== this._loadToken || !sprite) {
                return;
            }

            if (err || !spriteFrame) {
                sprite.spriteFrame = null;
                return;
            }

            sprite.spriteFrame = spriteFrame;
            this.applySpriteAspectRatio(spriteFrame);
        });
    }

    public setSelected(selected: boolean): void {
        if (this.item_selected) {
            this.item_selected.active = selected;
        }
    }

    private applySpriteAspectRatio(spriteFrame: SpriteFrame): void {
        if (!this.item_sp) {
            return;
        }

        const uiTransform = this.item_sp.getComponent(UITransform);
        const sprite = this.item_sp.getComponent(Sprite);
        if (!uiTransform || !sprite) {
            return;
        }

        const sourceWidth = spriteFrame.originalSize.width;
        const sourceHeight = spriteFrame.originalSize.height;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            return;
        }

        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
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
        if (!this.item_sp) {
            return;
        }

        const uiTransform = this.item_sp.getComponent(UITransform);
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
