import { _decorator, Color, Component, Node, resources, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const LOCKED_SPRITE_COLOR = new Color(0, 0, 0, 255);
const UNLOCKED_SPRITE_COLOR = new Color(255, 255, 255, 255);
const LOCKED_SPRITE_POSITION = new Vec3(0, 21, 0);
const UNLOCKED_SPRITE_POSITION = new Vec3(0, 0, 0);
const MAX_ITEM_SP_SIZE = 120;

@ccclass('BookItem')
export class BookItem extends Component {

    @property({ type: Node })
    tu_video_btn: Node = null;

    @property({ type: Sprite })
    item_sp: Sprite = null;

    
    private item_bg_sp: Sprite = null;

    private renderVersion = 0;

    onLoad() {
        this.item_bg_sp = this.node.getComponent(Sprite);
        this.resolveBindings();
    }

    start() {
        this.resolveBindings();
    }

    update(_deltaTime: number) {
    }

    public setImage(
        imagePath: string,
        unlocked: boolean = true,
        unlockedBg: SpriteFrame | null = null,
        lockedBg: SpriteFrame | null = null
    ): void {
        this.resolveBindings();
        const safeImagePath = (imagePath || '').trim();
        const sprite = this.item_sp;
        const renderVersion = ++this.renderVersion;
        const hasData = !!safeImagePath;

        this.node.active = hasData;
        this.setBackground(unlocked, unlockedBg, lockedBg);
        if (this.tu_video_btn) {
            this.tu_video_btn.active = hasData && !unlocked;
        }

        if (!sprite) {
            return;
        }

        sprite.color = unlocked ? UNLOCKED_SPRITE_COLOR : LOCKED_SPRITE_COLOR;
        sprite.node.setPosition(unlocked ? UNLOCKED_SPRITE_POSITION : LOCKED_SPRITE_POSITION);
        sprite.spriteFrame = null;
        if (!safeImagePath) {
            return;
        }

        resources.load(`${safeImagePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (renderVersion !== this.renderVersion || !this.node.activeInHierarchy) {
                return;
            }

            if (err || !spriteFrame) {
                console.warn(`BookItem: failed to load spriteFrame ${safeImagePath}`, err);
                sprite.spriteFrame = null;
                return;
            }

            sprite.spriteFrame = spriteFrame;
            this.applyPixelSpriteSize(spriteFrame);
        });
    }

    private resolveBindings(): void {
        if (!this.item_bg_sp) {
            this.item_bg_sp = this.node.getChildByName('item_bg_sp')?.getComponent(Sprite) ?? null;
        }

        if (!this.item_sp) {
            this.item_sp = this.node.getChildByName('item_sp')?.getComponent(Sprite) ?? null;
        }

        if (!this.tu_video_btn) {
            this.tu_video_btn = this.node.getChildByName('tu_video_btn') ?? null;
        }
    }

    private setBackground(unlocked: boolean, unlockedBg: SpriteFrame | null, lockedBg: SpriteFrame | null): void {
        if (!this.item_bg_sp) {
            return;
        }

        const spriteFrame = unlocked ? unlockedBg : lockedBg;
        if (spriteFrame) {
            this.item_bg_sp.spriteFrame = spriteFrame;
        }
    }

    private applyPixelSpriteSize(spriteFrame: SpriteFrame): void {
        if (!this.item_sp?.node || !spriteFrame) {
            return;
        }

        const uiTransform = this.item_sp.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        const sourceWidth = Math.max(1, Math.round(spriteFrame.originalSize.width));
        const sourceHeight = Math.max(1, Math.round(spriteFrame.originalSize.height));
        const maxSide = Math.max(sourceWidth, sourceHeight);
        const integerScale = Math.max(1, Math.floor(MAX_ITEM_SP_SIZE / maxSide));

        this.item_sp.sizeMode = Sprite.SizeMode.CUSTOM;
        uiTransform.setContentSize(sourceWidth * integerScale, sourceHeight * integerScale);
    }
}

