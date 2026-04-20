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
    private expectedAvatarUrl = '';
    private appliedAvatarUrl = '';

    onLoad() {
        this.defaultAvatarSpriteFrame = this.owner_avatar_sprite?.spriteFrame ?? null;
    }

    public applyRankingData(rank: number, nickname: string, levelText: string, avatarUrl: string = ''): void {
        this.setAvatarVisible(true);
        this.setUserBorderVisible(true);
        this.prepareAvatar(avatarUrl);

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
            this.owner_name_label.string = this.formatNicknameText(nickname);
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

        this.expectedAvatarUrl = '';
        this.appliedAvatarUrl = '';
        this.setAvatarVisible(false);
        this.resetAvatar();
    }

    public setAvatarSpriteFrame(spriteFrame: SpriteFrame | null, avatarUrl: string = ''): void {
        if (!this.owner_avatar_sprite || !spriteFrame) return;
        const normalizedAvatarUrl = (avatarUrl || '').trim();
        if (normalizedAvatarUrl && normalizedAvatarUrl !== this.expectedAvatarUrl) {
            return;
        }

        this.owner_avatar_sprite.spriteFrame = spriteFrame;
        this.appliedAvatarUrl = normalizedAvatarUrl || this.expectedAvatarUrl;
    }

    public resetAvatar(): void {
        if (!this.owner_avatar_sprite) return;
        this.owner_avatar_sprite.spriteFrame = this.defaultAvatarSpriteFrame;
    }

    public isExpectingAvatar(avatarUrl: string): boolean {
        return this.expectedAvatarUrl === (avatarUrl || '').trim();
    }

    private prepareAvatar(avatarUrl: string): void {
        const normalizedAvatarUrl = (avatarUrl || '').trim();
        if (normalizedAvatarUrl === this.expectedAvatarUrl) {
            return;
        }

        this.expectedAvatarUrl = normalizedAvatarUrl;
        if (!normalizedAvatarUrl) {
            this.appliedAvatarUrl = '';
            this.resetAvatar();
            return;
        }

        if (this.appliedAvatarUrl !== normalizedAvatarUrl) {
            this.resetAvatar();
        }
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

    private formatNicknameText(nickname: string): string {
        return ` ${nickname}`;
    }
}
