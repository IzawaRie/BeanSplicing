import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChartUser')
export class ChartUser extends Component {
    @property({ type: Node })
    medal_no1: Node = null;

    @property({ type: Node })
    medal_no2: Node = null;

    @property({ type: Node })
    medal_no3: Node = null;

    @property({ type: Node })
    user_border: Node = null;

    @property({ type: Sprite })
    owner_avatar_sprite: Sprite = null;

    @property({ type: Label })
    owner_name_label: Label = null;

    @property({ type: Label })
    owner_number_label: Label = null;

    @property({ type: Label })
    owner_level_label: Label = null;

    private defaultAvatarSpriteFrame: SpriteFrame | null = null;

    onLoad() {
        this.defaultAvatarSpriteFrame = this.owner_avatar_sprite?.spriteFrame ?? null;
    }

    public applyRankingData(rank: number, nickname: string, levelText: string): void {
        this.setAvatarVisible(true);
        this.resetAvatar();
        this.setUserBorderVisible(true);

        const isTop1 = rank === 1;
        const isTop2 = rank === 2;
        const isTop3 = rank === 3;
        const showMedal = rank > 0 && rank <= 3;

        if (this.medal_no1) this.medal_no1.active = isTop1;
        if (this.medal_no2) this.medal_no2.active = isTop2;
        if (this.medal_no3) this.medal_no3.active = isTop3;

        if (this.owner_number_label) {
            this.owner_number_label.node.active = !showMedal;
            this.owner_number_label.string = rank > 0 ? `${rank}` : '';
        }

        if (this.owner_name_label) {
            this.owner_name_label.string = nickname;
        }

        if (this.owner_level_label) {
            this.owner_level_label.string = levelText;
        }
    }

    public applyPlaceholder(message: string): void {
        if (this.medal_no1) this.medal_no1.active = false;
        if (this.medal_no2) this.medal_no2.active = false;
        if (this.medal_no3) this.medal_no3.active = false;
        this.setUserBorderVisible(false);

        if (this.owner_number_label) {
            this.owner_number_label.node.active = false;
            this.owner_number_label.string = '';
        }

        if (this.owner_name_label) {
            this.owner_name_label.string = message;
        }

        if (this.owner_level_label) {
            this.owner_level_label.string = '';
        }

        this.setAvatarVisible(false);
        this.resetAvatar();
    }

    public setAvatarSpriteFrame(spriteFrame: SpriteFrame | null): void {
        if (!this.owner_avatar_sprite || !spriteFrame) return;
        this.owner_avatar_sprite.spriteFrame = spriteFrame;
    }

    public resetAvatar(): void {
        if (!this.owner_avatar_sprite) return;
        this.owner_avatar_sprite.spriteFrame = this.defaultAvatarSpriteFrame;
    }

    private setAvatarVisible(visible: boolean): void {
        if (this.owner_avatar_sprite?.node) {
            this.owner_avatar_sprite.node.active = visible;
        }
    }

    private setUserBorderVisible(visible: boolean): void {
        if (this.user_border) {
            this.user_border.active = visible;
        }
    }
}

