import { _decorator, Component, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RewardItem')
export class RewardItem extends Component {

    @property({ type: Node })
    reward_lock: Node = null;

    @property({ type: Sprite })
    reward_bg_sp: Sprite = null;

    @property({ type: Sprite })
    reward_sp: Sprite = null;

    @property({ type: Label })
    reward_label: Label = null;

    private loadToken: number = 0;
    private baseSpriteWidth: number = 0;
    private baseSpriteHeight: number = 0;

    onLoad() {
        this.resolveBindings();
        this.captureBaseSpriteSize();
    }

    start() {

    }

    update(_deltaTime: number) {
    }

    public setData(
        imagePath: string,
        count: number,
        unlocked: boolean,
        unlockedBg: SpriteFrame | null,
        lockedBg: SpriteFrame | null
    ): void {
        this.resolveBindings();
        this.captureBaseSpriteSize();
        const safeImagePath = (imagePath || '').trim();
        const loadToken = ++this.loadToken;

        if (this.reward_label) {
            this.reward_label.string = `x${Math.max(0, Math.floor(Number(count) || 0))}`;
        }

        if (this.reward_lock) {
            this.reward_lock.active = !unlocked;
        }

        if (this.reward_bg_sp) {
            const bg = unlocked ? unlockedBg : lockedBg;
            if (bg) {
                this.reward_bg_sp.spriteFrame = bg;
            }
        }

        if (!this.reward_sp) {
            return;
        }

        this.reward_sp.spriteFrame = null;
        this.resetSpriteSize();
        if (!safeImagePath) {
            return;
        }

        resources.load(`${safeImagePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (loadToken !== this.loadToken || !this.reward_sp) {
                return;
            }

            if (err || !spriteFrame) {
                console.warn(`RewardItem: failed to load spriteFrame ${safeImagePath}`, err);
                this.reward_sp.spriteFrame = null;
                return;
            }

            this.reward_sp.spriteFrame = spriteFrame;
            this.applySpriteAspectRatio(spriteFrame);
        });
    }

    private resolveBindings(): void {
        if (!this.reward_lock) {
            this.reward_lock = this.node.getChildByName('reward_lock') ?? null;
        }

        if (!this.reward_bg_sp) {
            this.reward_bg_sp = this.node.getComponent(Sprite) ?? null;
        }

        if (!this.reward_sp) {
            this.reward_sp = this.node.getChildByName('reward_sp')?.getComponent(Sprite) ?? null;
        }

        if (!this.reward_label) {
            this.reward_label = this.node.getChildByName('reward_label')?.getComponent(Label) ?? null;
        }
    }

    private applySpriteAspectRatio(spriteFrame: SpriteFrame): void {
        if (!this.reward_sp?.node) {
            return;
        }

        const uiTransform = this.reward_sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        const { width: sourceWidth, height: sourceHeight } = spriteFrame.originalSize;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            return;
        }

        this.reward_sp.sizeMode = Sprite.SizeMode.CUSTOM;
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
        if (!this.reward_sp?.node) {
            return;
        }

        const uiTransform = this.reward_sp.node.getComponent(UITransform);
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
        if (!this.reward_sp?.node || this.baseSpriteWidth <= 0 || this.baseSpriteHeight <= 0) {
            return;
        }

        const uiTransform = this.reward_sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        this.reward_sp.sizeMode = Sprite.SizeMode.CUSTOM;
        uiTransform.setContentSize(this.baseSpriteWidth, this.baseSpriteHeight);
    }
}

