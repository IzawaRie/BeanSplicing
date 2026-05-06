import { _decorator, Component, Label, Sprite, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MailItemSp')
export class MailItemSp extends Component {
    @property({ type: Sprite })
    sp: Sprite = null;

    @property({ type: Label })
    number: Label = null;

    private baseSpriteWidth: number = 0;
    private baseSpriteHeight: number = 0;

    protected onLoad(): void {
        this.captureBaseSpriteSize();
    }

    public setData(spriteFrame: SpriteFrame | null, count: number): void {
        this.captureBaseSpriteSize();
        if (this.sp) {
            this.sp.spriteFrame = spriteFrame;
            this.resetSpriteSize();
            if (spriteFrame) {
                this.applySpriteAspectRatio(spriteFrame);
            }
        }

        if (this.number) {
            this.number.string = `x${Math.max(0, Math.floor(Number(count) || 0))}`;
        }
    }

    private applySpriteAspectRatio(spriteFrame: SpriteFrame): void {
        if (!this.sp?.node) {
            return;
        }

        const uiTransform = this.sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        const { width: sourceWidth, height: sourceHeight } = spriteFrame.originalSize;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            return;
        }

        this.sp.sizeMode = Sprite.SizeMode.CUSTOM;
        const baseWidth = this.baseSpriteWidth > 0 ? this.baseSpriteWidth : uiTransform.width;
        const baseHeight = this.baseSpriteHeight > 0 ? this.baseSpriteHeight : uiTransform.height;
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
        if (!this.sp?.node) {
            return;
        }

        const uiTransform = this.sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        if (this.baseSpriteWidth <= 0) {
            this.baseSpriteWidth = uiTransform.width;
        }
        if (this.baseSpriteHeight <= 0) {
            this.baseSpriteHeight = uiTransform.height;
        }
    }

    private resetSpriteSize(): void {
        if (!this.sp?.node || this.baseSpriteWidth <= 0 || this.baseSpriteHeight <= 0) {
            return;
        }

        const uiTransform = this.sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        this.sp.sizeMode = Sprite.SizeMode.CUSTOM;
        uiTransform.setContentSize(this.baseSpriteWidth, this.baseSpriteHeight);
    }
}


