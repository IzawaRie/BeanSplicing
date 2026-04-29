import { _decorator, Color, Component, instantiate, Label, LabelOutline, Layout, Node, Prefab, resources, Sprite, SpriteFrame } from 'cc';
import { RewardItem } from './RewardItem';
const { ccclass, property } = _decorator;

type RewardPopupItem = {
    imagePath: string;
    count: number;
    type: string;
};

type RewardPopupProgressItem = {
    progress: number;
    rewards: RewardPopupItem[];
};

type RewardButtonState = 'locked' | 'claim' | 'confirm';
type RewardClaimHandler = ((progress: number, rewards: RewardPopupItem[]) => void) | null;
type RewardCloseHandler = (() => void) | null;

const REWARD_ITEM_PREFAB_PATH = 'reward_item';
const REWARD_ITEMS_REACHED_Y = -45;
const REWARD_ITEMS_LOCKED_Y = -70;
const REWARD_BTN_OUTLINE_UNLOCKED = new Color(28, 70, 21, 255);
const REWARD_BTN_OUTLINE_LOCKED = new Color(45, 43, 44, 255);

@ccclass('RewardController')
export class RewardController extends Component {

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Node })
    reward_grogress: Node = null;

    @property({ type: Node })
    reward_tip_reward: Node = null;

    @property({ type: Node })
    reward_next_tip: Node = null;

    @property({ type: Node })
    reward_suc_tip: Node = null;

    @property({ type: Node })
    reward_items: Node = null;

    @property({ type: Node })
    reward_btn: Node = null;

    @property({ type: Node })
    reward_red_point: Node = null;

    @property({ type: Label })
    progress_difficulty_label: Label = null;

    @property({ type: Label })
    progress_label: Label = null;

    @property({ type: Label })
    reward_tip_2: Label = null;

    @property({ type: Label })
    reward_btn_label: Label = null;

    @property({ type: SpriteFrame })
    reward_item_bg_unlock: SpriteFrame = null;

    @property({ type: SpriteFrame })
    reward_item_bg_lock: SpriteFrame = null;

    @property({ type: SpriteFrame })
    reward_lock_btn: SpriteFrame = null;

    @property({ type: SpriteFrame })
    reward_unlock_btn: SpriteFrame = null;

    private rewardBtnSprite: Sprite | null = null;
    private rewardItemPrefab: Prefab | null = null;
    private rewardItemPrefabTask: Promise<Prefab | null> | null = null;
    private itemRenderVersion = 0;
    private rewardButtonState: RewardButtonState = 'locked';
    private currentSelectedProgress = 0;
    private currentTargetReward: RewardPopupProgressItem | null = null;
    private rewardClaimHandler: RewardClaimHandler = null;
    private rewardCloseHandler: RewardCloseHandler = null;

    onLoad() {
        this.resolveReferences();
        this.bindButtonEvents();
    }

    start() {
    }

    update(_deltaTime: number) {
    }

    onDestroy() {
        this.unbindButtonEvents();
    }

    public async refreshData(
        difficultyText: string,
        difficultyColor: Color | null,
        collectedCount: number,
        totalCount: number,
        progressRewards: RewardPopupProgressItem[],
        claimedProgresses: number[] = [],
        onClaimReward: RewardClaimHandler = null
    ): Promise<void> {
        this.resolveReferences();
        this.rewardClaimHandler = onClaimReward;
        if (this.reward_grogress) {
            this.reward_grogress.active = true;
        }
        const normalizedRewards = this.normalizeProgressRewards(progressRewards);
        const claimedProgressSet = this.createClaimedProgressSet(claimedProgresses);
        const targetReward = this.selectTargetReward(collectedCount, normalizedRewards, claimedProgressSet);
        const targetCount = targetReward?.progress ?? totalCount;
        const reached = !!targetReward && collectedCount >= targetCount && !claimedProgressSet.has(targetCount);
        const remainingProgress = Math.max(0, targetCount - collectedCount);

        this.currentSelectedProgress = targetReward?.progress ?? 0;
        this.currentTargetReward = targetReward;

        if (this.progress_difficulty_label) {
            this.progress_difficulty_label.string = difficultyText;
            if (difficultyColor) {
                this.progress_difficulty_label.color = difficultyColor;
            }
        }
        if (this.progress_label) {
            this.progress_label.string = ` ${collectedCount}/${totalCount}`;
        }
        if (this.reward_tip_2) {
            this.reward_tip_2.string = `${reached ? Math.max(0, targetCount) : remainingProgress}`;
        }

        await this.renderRewardItems(targetReward?.rewards ?? [], reached);
        this.updateRewardItemsPosition(reached);
        this.applyMainState(reached);
    }

    public open(): void {
        this.node.active = true;
    }

    public closePopup(): void {
        this.node.active = false;
        this.rewardCloseHandler?.();
    }

    public setCloseHandler(handler: RewardCloseHandler): void {
        this.rewardCloseHandler = handler;
    }

    private bindButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.reward_btn?.on(Node.EventType.TOUCH_END, this.onRewardBtnClick, this);
    }

    private unbindButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.reward_btn?.off(Node.EventType.TOUCH_END, this.onRewardBtnClick, this);
    }

    private onCloseBtnClick(): void {
        this.closePopup();
    }

    private onRewardBtnClick(): void {
        if (this.rewardButtonState === 'locked') {
            return;
        }

        if (this.rewardButtonState === 'claim') {
            this.claimCurrentReward();
            this.applySuccessState();
            return;
        }

        this.closePopup();
    }

    private applyMainState(reached: boolean): void {
        if (reached) {
            this.rewardButtonState = 'claim';
            this.setTipState(true, false, false);
            this.setRewardButtonState('全部领取', this.reward_unlock_btn ?? this.rewardBtnSprite?.spriteFrame ?? null);
            this.setRewardRedPointVisible(true);
            this.setRewardButtonOutlineColor(REWARD_BTN_OUTLINE_UNLOCKED);
            return;
        }

        this.rewardButtonState = 'locked';
        this.setTipState(false, true, false);
        this.setRewardButtonState('继续收集', this.reward_lock_btn ?? this.rewardBtnSprite?.spriteFrame ?? null);
        this.setRewardRedPointVisible(false);
        this.setRewardButtonOutlineColor(REWARD_BTN_OUTLINE_LOCKED);
    }

    private applySuccessState(): void {
        this.rewardButtonState = 'confirm';
        this.setTipState(false, false, true);
        if (this.reward_grogress) {
            this.reward_grogress.active = false;
        }
        if (this.reward_items) {
            this.reward_items.active = false;
        }
        this.setRewardButtonState('确定', this.reward_unlock_btn ?? this.rewardBtnSprite?.spriteFrame ?? null);
        this.setRewardRedPointVisible(false);
        this.setRewardButtonOutlineColor(REWARD_BTN_OUTLINE_UNLOCKED);
    }

    private setTipState(showRewardTip: boolean, showNextTip: boolean, showSuccessTip: boolean): void {
        if (this.reward_tip_reward) {
            this.reward_tip_reward.active = showRewardTip;
        }
        if (this.reward_next_tip) {
            this.reward_next_tip.active = showNextTip;
        }
        if (this.reward_suc_tip) {
            this.reward_suc_tip.active = showSuccessTip;
        }
    }

    private setRewardRedPointVisible(visible: boolean): void {
        if (this.reward_red_point) {
            this.reward_red_point.active = visible;
        }
    }

    private setRewardButtonState(text: string, spriteFrame: SpriteFrame | null): void {
        if (this.reward_btn_label) {
            this.reward_btn_label.string = text;
        }
        if (this.rewardBtnSprite && spriteFrame) {
            this.rewardBtnSprite.spriteFrame = spriteFrame;
        }
    }

    private setRewardButtonOutlineColor(color: Color): void {
        const labelOutline = this.reward_btn_label?.node.getComponent(LabelOutline);
        if (labelOutline) {
            labelOutline.color = color;
        }
    }

    private claimCurrentReward(): void {
        if (!this.currentTargetReward || this.currentSelectedProgress <= 0) {
            return;
        }

        this.rewardClaimHandler?.(this.currentSelectedProgress, this.currentTargetReward.rewards);
        this.currentTargetReward = null;
    }

    private updateRewardItemsPosition(reached: boolean): void {
        if (!this.reward_items) {
            return;
        }

        this.reward_items.setPosition(0, reached ? REWARD_ITEMS_REACHED_Y : REWARD_ITEMS_LOCKED_Y, 0);
    }

    private async renderRewardItems(rewards: RewardPopupItem[], unlocked: boolean): Promise<void> {
        if (!this.reward_items) {
            return;
        }

        this.reward_items.active = true;
        const renderVersion = ++this.itemRenderVersion;
        const prefab = await this.loadRewardItemPrefab();
        if (!prefab || renderVersion !== this.itemRenderVersion || !this.reward_items.isValid) {
            return;
        }

        while (this.reward_items.children.length < rewards.length) {
            this.reward_items.addChild(instantiate(prefab));
        }

        for (let i = 0; i < this.reward_items.children.length; i++) {
            const node = this.reward_items.children[i];
            const reward = rewards[i] ?? null;
            node.active = !!reward;
            if (!reward) {
                continue;
            }

            const rewardItem = node.getComponent(RewardItem);
            rewardItem?.setData(
                reward.imagePath,
                reward.count,
                unlocked,
                this.reward_item_bg_unlock,
                this.reward_item_bg_lock
            );
        }

        this.reward_items.getComponent(Layout)?.updateLayout(true);
    }

    private async loadRewardItemPrefab(): Promise<Prefab | null> {
        if (this.rewardItemPrefab) {
            return this.rewardItemPrefab;
        }
        if (this.rewardItemPrefabTask) {
            return await this.rewardItemPrefabTask;
        }

        this.rewardItemPrefabTask = new Promise<Prefab | null>((resolve) => {
            resources.load(REWARD_ITEM_PREFAB_PATH, Prefab, (err, prefab) => {
                this.rewardItemPrefabTask = null;
                if (err || !prefab) {
                    console.warn(`RewardController: failed to load ${REWARD_ITEM_PREFAB_PATH}`, err);
                    resolve(null);
                    return;
                }

                this.rewardItemPrefab = prefab;
                this.resolveRewardItemBackgroundFallbacks(prefab);
                resolve(prefab);
            });
        });

        return await this.rewardItemPrefabTask;
    }

    private resolveRewardItemBackgroundFallbacks(prefab: Prefab): void {
        const prefabRewardItem = prefab.data?.getComponent?.(RewardItem) as RewardItem | null;
        const prefabBgSprite = prefab.data?.getComponent?.(Sprite) as Sprite | null;
        if (!this.reward_item_bg_lock) {
            this.reward_item_bg_lock = prefabBgSprite?.spriteFrame ?? null;
        }
        if (!this.reward_unlock_btn) {
            this.reward_unlock_btn = this.rewardBtnSprite?.spriteFrame ?? null;
        }
        if (!this.reward_item_bg_unlock && prefabRewardItem?.reward_bg_sp?.spriteFrame) {
            this.reward_item_bg_unlock = prefabRewardItem.reward_bg_sp.spriteFrame;
        }
    }

    private selectTargetReward(
        collectedCount: number,
        rewards: RewardPopupProgressItem[],
        claimedProgresses: Set<number>
    ): RewardPopupProgressItem | null {
        if (rewards.length <= 0) {
            return null;
        }

        for (const reward of rewards) {
            if (collectedCount >= reward.progress && !claimedProgresses.has(reward.progress)) {
                return reward;
            }
        }

        for (const reward of rewards) {
            if (collectedCount < reward.progress && !claimedProgresses.has(reward.progress)) {
                return reward;
            }
        }

        return null;
    }

    private createClaimedProgressSet(progresses: number[]): Set<number> {
        return new Set(
            (Array.isArray(progresses) ? progresses : [])
                .map((progress) => Math.max(0, Math.floor(Number(progress) || 0)))
                .filter((progress) => progress >= 1)
        );
    }

    private normalizeProgressRewards(rewards: RewardPopupProgressItem[]): RewardPopupProgressItem[] {
        if (!Array.isArray(rewards)) {
            return [];
        }

        return rewards
            .filter((reward) => Number.isFinite(Number(reward.progress)) && Array.isArray(reward.rewards))
            .map((reward) => ({
                progress: Math.max(0, Math.floor(Number(reward.progress) || 0)),
                rewards: reward.rewards
                    .filter((item) => !!item && typeof item.imagePath === 'string')
                    .map((item) => ({
                        imagePath: item.imagePath,
                        count: Math.max(0, Math.floor(Number(item.count) || 0)),
                        type: String(item.type || '')
                    }))
            }))
            .filter((reward) => reward.progress > 0)
            .sort((a, b) => a.progress - b.progress);
    }

    private resolveReferences(): void {
        this.close_btn = this.close_btn
            ?? this.findChildByName(this.node, 'tu_close_btn')
            ?? this.findChildByName(this.node, 'close_btn');
        this.reward_grogress = this.reward_grogress ?? this.findChildByName(this.node, 'reward_grogress');
        this.reward_tip_reward = this.reward_tip_reward ?? this.findChildByName(this.node, 'reward_tip_reward');
        this.reward_next_tip = this.reward_next_tip ?? this.findChildByName(this.node, 'reward_next_tip');
        this.reward_suc_tip = this.reward_suc_tip ?? this.findChildByName(this.node, 'reward_suc_tip');
        this.reward_items = this.reward_items ?? this.findChildByName(this.node, 'reward_items');
        this.reward_btn = this.reward_btn ?? this.findChildByName(this.node, 'reward_btn');
        this.reward_red_point = this.reward_red_point ?? this.findChildByName(this.node, 'reward_red_point');
        this.progress_difficulty_label = this.progress_difficulty_label
            ?? this.findChildByName(this.node, 'reward__progress_difficulty')?.getComponent(Label)
            ?? null;
        this.progress_label = this.progress_label
            ?? this.findChildByName(this.node, 'reward__progress_label')?.getComponent(Label)
            ?? null;
        this.reward_tip_2 = this.reward_tip_2
            ?? this.findChildByName(this.node, 'reward_tip_2')?.getComponent(Label)
            ?? null;
        this.reward_btn_label = this.reward_btn_label
            ?? this.findChildByName(this.node, 'reward_btn_label')?.getComponent(Label)
            ?? null;
        this.rewardBtnSprite = this.rewardBtnSprite ?? this.reward_btn?.getComponent(Sprite) ?? null;
        if (!this.reward_unlock_btn) {
            this.reward_unlock_btn = this.rewardBtnSprite?.spriteFrame ?? null;
        }
    }

    private findChildByName(root: Node | null, name: string): Node | null {
        if (!root) {
            return null;
        }

        if (root.name === name) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findChildByName(child, name);
            if (result) {
                return result;
            }
        }
        return null;
    }
}
