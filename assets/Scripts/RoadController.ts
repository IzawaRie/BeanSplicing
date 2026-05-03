import { _decorator, Component, instantiate, JsonAsset, Label, Layout, Node, Prefab, resources, ScrollView, Sprite, SpriteFrame, UITransform, Vec2 } from 'cc';
import { RoadLevelItem } from './RoadLevelItem';
import { RoadReward, RoadRewardLevelData } from './RoadReward';
import { GameManager } from './GameManager';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

const ROAD_PASS_CONFIG_PATH = 'pass/pass_config';
const ROAD_REWARD_ITEM_PREFAB_PATH = 'road_reward_items';
const ROAD_REWARD_VISIBLE_COUNT = 8;
const ROAD_REWARD_SNAP_EPSILON = 0.5;
const ROAD_REWARD_SNAP_INDEX_EPSILON = 2;
const ROAD_SEASON_END_TIME = new Date(2026, 5, 1, 0, 0, 0).getTime();
const ROAD_PASS_VIDEO_UNLOCK_REQUIRED_COUNT = 10;

type RoadPassConfigFile = {
    levels?: RoadRewardLevelData[];
};

export type RoadPassRewardClaimState = {
    freeClaimedLevels: number[];
    premiumClaimedLevels: number[];
};

@ccclass('RoadController')
export class RoadController extends Component {

    @property({ type: Node })
    reward_btn: Node = null;

    @property({ type: Node })
    video_btn: Node = null;

    @property({ type: Node })
    reward_btn_point: Node = null;

    @property({ type: Node })
    reward_items_content: Node = null;

    @property({ type: Sprite })
    exp_sp: Sprite = null;

    @property({ type: Sprite })
    progress_sp: Sprite = null;

    @property({ type: Label })
    coin_number: Label = null;

    @property({ type: Label })
    time: Label = null;

    @property({ type: Label })
    exp: Label = null;

    @property({ type: Label })
    level: Label = null;

    @property({ type: Label })
    reward_tip: Label = null;

    @property({ type: Label })
    video_tip: Label = null;

    @property({ type: Label })
    reward_point_number: Label = null;

    @property({ type: SpriteFrame })
    road_normal_border: SpriteFrame = null;

    @property({ type: SpriteFrame })
    road_light_border: SpriteFrame = null;

    @property({ type: SpriteFrame })
    road_lock_border: SpriteFrame = null;

    @property({ type: SpriteFrame })
    road_right: SpriteFrame = null;

    @property({ type: SpriteFrame })
    road_selected_border: SpriteFrame = null;

    @property({ type: SpriteFrame })
    road_lock: SpriteFrame = null;

    @property({ type: RoadLevelItem })
    road_level_item: RoadLevelItem[] = [];

    private _experience: number = 0;
    private _passLevel: number = 1;
    private rewardItemPrefab: Prefab | null = null;
    private rewardItemPrefabTask: Promise<Prefab | null> | null = null;
    private readonly rewardItems: RoadRewardLevelData[] = [];
    private readonly rewardItemNodes: Node[] = [];
    private readonly rewardItemNodeDataIndices = new Map<Node, number>();
    private readonly freeClaimedLevels = new Set<number>();
    private readonly premiumClaimedLevels = new Set<number>();
    private premiumPassUnlocked: boolean = false;
    private currentRewardStartIndex: number = -1;
    private rewardRenderVersion: number = 0;
    private rewardSnapTargetY: number | null = null;
    private isRewardScrollTouching: boolean = false;
    private rewardAdWatchCount: number = 0;
    private rewardBtnDefaultPosition: { x: number; y: number; z: number } | null = null;
    private videoBtnDefaultPosition: { x: number; y: number; z: number } | null = null;

    public get experience(): number {
        return this._experience;
    }

    public set experience(value: number) {
        this._experience = Math.max(0, Math.floor(Number(value) || 0));
        this.refreshPassLevelByExperience();
        this.updateExperienceLabel();
        this.updateRewardClaimReminder();
        this.rewardItemNodeDataIndices.clear();
        this.updateRewardVirtualList(true);
    }

    public get passLevel(): number {
        return this._passLevel;
    }

    public set passLevel(value: number) {
        this._passLevel = Math.max(1, Math.floor(Number(value) || 1));
        this.updatePassLevelLabel();
        this.updateRoadLevelItems();
        this.updateRewardClaimReminder();
        this.rewardItemNodeDataIndices.clear();
        this.updateRewardVirtualList(true);
    }

    public addExperience(amount: number): void {
        if (amount <= 0) {
            return;
        }

        this.experience = this._experience + amount;
    }

    public addPassLevel(amount: number = 1): void {
        if (amount <= 0) {
            return;
        }

        this.passLevel = this._passLevel + amount;
    }

    public setCoinCount(value: number): void {
        if (this.coin_number) {
            this.coin_number.string = `${Math.max(0, Math.floor(Number(value) || 0))}`;
        }
    }

    public setRewardClaimState(state: RoadPassRewardClaimState | null): void {
        this.freeClaimedLevels.clear();
        this.premiumClaimedLevels.clear();

        for (const level of this.normalizeClaimedLevels(state?.freeClaimedLevels)) {
            this.freeClaimedLevels.add(level);
        }
        for (const level of this.normalizeClaimedLevels(state?.premiumClaimedLevels)) {
            this.premiumClaimedLevels.add(level);
        }

        this.rewardItemNodeDataIndices.clear();
        this.updateRewardClaimReminder();
        this.updateRewardVirtualList(true);
    }

    public setPremiumPassUnlocked(unlocked: boolean): void {
        this.premiumPassUnlocked = unlocked === true;
        this.updatePremiumPassButtonState();
        this.rewardItemNodeDataIndices.clear();
        this.updateRewardClaimReminder();
        this.updateRewardVirtualList(true);
    }

    public getPremiumPassUnlocked(): boolean {
        return this.premiumPassUnlocked;
    }

    public setRewardAdWatchCount(count: number): void {
        this.rewardAdWatchCount = this.normalizeRewardAdWatchCount(count);
        this.updateVideoTip();
    }

    public getRewardAdWatchCount(): number {
        return this.rewardAdWatchCount;
    }

    public getRewardClaimState(): RoadPassRewardClaimState {
        return {
            freeClaimedLevels: Array.from(this.freeClaimedLevels).sort((a, b) => a - b),
            premiumClaimedLevels: Array.from(this.premiumClaimedLevels).sort((a, b) => a - b)
        };
    }

    public setFreeRewardClaimed(level: number, claimed: boolean = true): void {
        this.setRewardClaimed(this.freeClaimedLevels, level, claimed);
    }

    public setPremiumRewardClaimed(level: number, claimed: boolean = true): void {
        this.setRewardClaimed(this.premiumClaimedLevels, level, claimed);
    }

    public isFreeRewardClaimed(level: number): boolean {
        return this.freeClaimedLevels.has(this.normalizeRewardLevel(level));
    }

    public isPremiumRewardClaimed(level: number): boolean {
        return this.premiumClaimedLevels.has(this.normalizeRewardLevel(level));
    }

    start() {
        this.updateExperienceLabel();
        this.updatePassLevelLabel();
        this.updateRoadLevelItems();
        this.updateSeasonRemainingTime();
        this.updateVideoTip();
        this.updatePremiumPassButtonState();
        this.schedule(this.updateSeasonRemainingTime, 60);
        this.bindButtonEvents();
        this.bindRewardScrollEvents();
        void this.loadRewardItems();
    }

    onDestroy() {
        this.unschedule(this.updateSeasonRemainingTime);
        this.unbindButtonEvents();
        this.unbindRewardScrollEvents();
    }

    update(_deltaTime: number) {
        this.updateRewardVirtualList();
    }

    private updateExperienceLabel(): void {
        if (this.exp) {
            this.exp.string = `${this._experience}/${this.getCurrentRequiredExp()}`;
        }
    }

    private updatePassLevelLabel(): void {
        if (this.level) {
            this.level.string = `Lv.${this._passLevel}`;
        }
    }

    private updateSeasonRemainingTime(): void {
        if (!this.time) {
            return;
        }

        const remainingMs = Math.max(0, ROAD_SEASON_END_TIME - Date.now());
        const totalHours = Math.floor(remainingMs / (60 * 60 * 1000));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        this.time.string = `赛季剩余时间：${days}天${hours}小时`;
    }

    private bindButtonEvents(): void {
        this.reward_btn?.on(Node.EventType.TOUCH_END, this.onRewardBtnClick, this);
        this.video_btn?.on(Node.EventType.TOUCH_END, this.onVideoBtnClick, this);
    }

    private unbindButtonEvents(): void {
        this.reward_btn?.off(Node.EventType.TOUCH_END, this.onRewardBtnClick, this);
        this.video_btn?.off(Node.EventType.TOUCH_END, this.onVideoBtnClick, this);
    }

    private onRewardBtnClick(): void {
        if (GameManager.getInstance()?.isWindowBlocking([this.node])) return;
        AudioManager.instance?.playEffect('click_btn');
        this.claimAllAvailableRewards();
    }

    private onVideoBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking([this.node])) return;
        if (!gameManager || this.premiumPassUnlocked) {
            return;
        }

        AudioManager.instance?.playEffect('click_btn');
        if (this.rewardAdWatchCount >= ROAD_PASS_VIDEO_UNLOCK_REQUIRED_COUNT) {
            gameManager.setRoadPassPremiumUnlocked(true);
            return;
        }

        gameManager.wxManager?.showRewardedVideoAd((success) => {
            if (!success) {
                return;
            }

            const nextCount = this.normalizeRewardAdWatchCount(this.rewardAdWatchCount + 1);
            gameManager.setRoadPassVideoWatchCount(nextCount);
            if (nextCount >= ROAD_PASS_VIDEO_UNLOCK_REQUIRED_COUNT) {
                gameManager.setRoadPassPremiumUnlocked(true);
            }
        });
    }

    private updateRoadLevelItems(): void {
        const currentLevel = Math.max(1, Math.floor(Number(this._passLevel) || 1));
        const startLevel = Math.max(1, currentLevel - 3);

        for (let i = 0; i < this.road_level_item.length; i++) {
            const item = this.road_level_item[i];
            if (!item) {
                continue;
            }

            const displayLevel = startLevel + i;
            if (item.item_level) {
                item.item_level.string = `${displayLevel}`;
            }
            if (item.item_road_arrow_down) {
                item.item_road_arrow_down.active = displayLevel === currentLevel;
            }
            if (item.item_coin) {
                item.item_coin.spriteFrame = this.getRoadLevelItemSpriteFrame(displayLevel, currentLevel);
            }
        }
    }

    private getRoadLevelItemSpriteFrame(displayLevel: number, currentLevel: number): SpriteFrame | null {
        if (displayLevel < currentLevel) {
            return this.road_right ?? null;
        }
        if (displayLevel === currentLevel) {
            return this.road_selected_border ?? null;
        }

        return this.road_lock ?? null;
    }

    private updateRewardClaimReminder(): void {
        const claimableCount = this.getClaimableRewardCount();
        if (this.reward_btn_point) {
            this.reward_btn_point.active = claimableCount > 0;
        }
        if (this.reward_point_number) {
            this.reward_point_number.string = `${claimableCount}`;
        }
        if (this.reward_tip) {
            this.reward_tip.string = `可领取${claimableCount}项奖励`;
        }
        this.updateRewardButtonVisibility(claimableCount);
    }

    private updateVideoTip(): void {
        if (this.video_tip) {
            this.video_tip.string = `看10次广告可解锁(${this.rewardAdWatchCount}/${ROAD_PASS_VIDEO_UNLOCK_REQUIRED_COUNT})`;
        }
    }

    private updateRewardButtonVisibility(claimableCount: number = this.getClaimableRewardCount()): void {
        const shouldShowRewardBtn = claimableCount > 0;
        if (this.reward_btn) {
            this.reward_btn.active = shouldShowRewardBtn;
        }
        this.updateRewardActionButtonLayout(shouldShowRewardBtn);
    }

    private updatePremiumPassButtonState(): void {
        this.captureRewardBtnDefaultPosition();
        this.captureVideoBtnDefaultPosition();

        if (this.video_btn) {
            this.video_btn.active = !this.premiumPassUnlocked;
        }

        this.updateRewardActionButtonLayout(this.reward_btn?.active === true);
    }

    private captureRewardBtnDefaultPosition(): void {
        if (!this.reward_btn || this.rewardBtnDefaultPosition) {
            return;
        }

        const position = this.reward_btn.position;
        this.rewardBtnDefaultPosition = {
            x: position.x,
            y: position.y,
            z: position.z
        };
    }

    private captureVideoBtnDefaultPosition(): void {
        if (!this.video_btn || this.videoBtnDefaultPosition) {
            return;
        }

        const position = this.video_btn.position;
        this.videoBtnDefaultPosition = {
            x: position.x,
            y: position.y,
            z: position.z
        };
    }

    private updateRewardActionButtonLayout(showRewardBtn: boolean): void {
        if (this.reward_btn?.active) {
            const rewardBtnX = this.premiumPassUnlocked ? 0 : -240;
            this.reward_btn.setPosition(rewardBtnX, -800, this.reward_btn.position.z);
        }

        if (!this.video_btn || !this.video_btn.active) {
            return;
        }

        if (showRewardBtn) {
            this.video_btn.setPosition(210, -800, this.video_btn.position.z);
            return;
        }

        this.video_btn.setPosition(0, -800, this.video_btn.position.z);
    }

    private getClaimableRewardCount(): number {
        if (this.rewardItems.length <= 0) {
            return 0;
        }

        const currentPassLevel = this.getCurrentPassLevel();
        let count = 0;
        for (const item of this.rewardItems) {
            if (item.level > currentPassLevel) {
                continue;
            }
            if (!this.freeClaimedLevels.has(item.level)) {
                count++;
            }
            if (this.premiumPassUnlocked && !this.premiumClaimedLevels.has(item.level)) {
                count++;
            }
        }

        return count;
    }

    private claimAllAvailableRewards(): void {
        if (this.rewardItems.length <= 0 || this.getClaimableRewardCount() <= 0) {
            return;
        }

        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            return;
        }

        const currentPassLevel = this.getCurrentPassLevel();
        let claimedAny = false;
        for (const item of this.rewardItems) {
            if (item.level > currentPassLevel) {
                continue;
            }

            if (!this.freeClaimedLevels.has(item.level)) {
                gameManager.applyRewardItem(item.freeReward);
                this.freeClaimedLevels.add(item.level);
                gameManager.setRoadPassFreeRewardClaimed(item.level, true);
                claimedAny = true;
            }

            if (this.premiumPassUnlocked && !this.premiumClaimedLevels.has(item.level)) {
                gameManager.applyRewardItem(item.premiumReward);
                this.premiumClaimedLevels.add(item.level);
                gameManager.setRoadPassPremiumRewardClaimed(item.level, true);
                claimedAny = true;
            }
        }

        if (!claimedAny) {
            return;
        }

        this.rewardItemNodeDataIndices.clear();
        this.updateRewardClaimReminder();
        this.updateRewardVirtualList(true);
    }

    private async loadRewardItems(): Promise<void> {
        const renderToken = ++this.rewardRenderVersion;
        const [config, prefab] = await Promise.all([
            this.loadRoadPassConfig(),
            this.loadRewardItemPrefab()
        ]);

        if (renderToken !== this.rewardRenderVersion || !this.reward_items_content || !prefab) {
            return;
        }

        this.rewardItems.length = 0;
        this.rewardItems.push(...config);
        this.refreshPassLevelByExperience();
        this.updateExperienceLabel();
        this.updatePassLevelLabel();
        this.updateRoadLevelItems();
        this.updateRewardClaimReminder();
        this.ensureRewardItemNodes(prefab);
        this.syncRewardItemChildren();
        this.updateRewardContentSize();
        this.scrollRewardListToTop();
        this.updateRewardVirtualList(true);
    }

    private loadRoadPassConfig(): Promise<RoadRewardLevelData[]> {
        return new Promise((resolve) => {
            resources.load(ROAD_PASS_CONFIG_PATH, JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn(`RoadController: failed to load ${ROAD_PASS_CONFIG_PATH}`, err);
                    resolve([]);
                    return;
                }

                const json = (jsonAsset.json || {}) as RoadPassConfigFile;
                resolve(this.normalizeRewardLevels(json.levels));
            });
        });
    }

    private loadRewardItemPrefab(): Promise<Prefab | null> {
        if (this.rewardItemPrefab) {
            return Promise.resolve(this.rewardItemPrefab);
        }
        if (this.rewardItemPrefabTask) {
            return this.rewardItemPrefabTask;
        }

        this.rewardItemPrefabTask = new Promise((resolve) => {
            resources.load(ROAD_REWARD_ITEM_PREFAB_PATH, Prefab, (err, prefab) => {
                this.rewardItemPrefabTask = null;
                if (err || !prefab) {
                    console.warn(`RoadController: failed to load ${ROAD_REWARD_ITEM_PREFAB_PATH}`, err);
                    resolve(null);
                    return;
                }

                this.rewardItemPrefab = prefab;
                resolve(prefab);
            });
        });
        return this.rewardItemPrefabTask;
    }

    private bindRewardScrollEvents(): void {
        const scrollView = this.getRewardScrollView();
        scrollView?.node.on(Node.EventType.TOUCH_START, this.onRewardScrollTouchStart, this);
        scrollView?.node.on(Node.EventType.TOUCH_END, this.onRewardScrollTouchEnd, this);
        scrollView?.node.on(Node.EventType.TOUCH_CANCEL, this.onRewardScrollTouchEnd, this);
        scrollView?.node.on(ScrollView.EventType.SCROLL_ENDED, this.onRewardScrollEnded, this);
    }

    private unbindRewardScrollEvents(): void {
        const scrollView = this.getRewardScrollView();
        scrollView?.node.off(Node.EventType.TOUCH_START, this.onRewardScrollTouchStart, this);
        scrollView?.node.off(Node.EventType.TOUCH_END, this.onRewardScrollTouchEnd, this);
        scrollView?.node.off(Node.EventType.TOUCH_CANCEL, this.onRewardScrollTouchEnd, this);
        scrollView?.node.off(ScrollView.EventType.SCROLL_ENDED, this.onRewardScrollEnded, this);
    }

    private onRewardScrollTouchStart(): void {
        this.isRewardScrollTouching = true;
        this.rewardSnapTargetY = null;
    }

    private onRewardScrollTouchEnd(): void {
        this.isRewardScrollTouching = false;
        this.scheduleOnce(() => this.trySnapRewardScroll(), 0);
    }

    private onRewardScrollEnded(): void {
        this.isRewardScrollTouching = false;
        this.scheduleOnce(() => this.trySnapRewardScroll(true), 0);
    }

    private ensureRewardItemNodes(prefab: Prefab): void {
        const targetCount = Math.min(ROAD_REWARD_VISIBLE_COUNT, this.rewardItems.length);
        while (this.rewardItemNodes.length < targetCount) {
            const itemNode = instantiate(prefab);
            itemNode.active = false;
            this.rewardItemNodes.push(itemNode);
        }

        for (let i = targetCount; i < this.rewardItemNodes.length; i++) {
            this.rewardItemNodes[i].active = false;
            this.rewardItemNodeDataIndices.delete(this.rewardItemNodes[i]);
        }
    }

    private syncRewardItemChildren(): void {
        if (!this.reward_items_content) {
            return;
        }

        const managedNodes = new Set<Node>(this.rewardItemNodes);
        for (const child of [...this.reward_items_content.children]) {
            if (!managedNodes.has(child)) {
                child.removeFromParent();
                child.active = false;
            }
        }

        for (const itemNode of this.rewardItemNodes) {
            if (itemNode.parent !== this.reward_items_content) {
                this.reward_items_content.addChild(itemNode);
            }
        }
    }

    private updateRewardVirtualList(force: boolean = false): void {
        if (!this.node.active || !this.reward_items_content || this.rewardItems.length <= 0 || this.rewardItemNodes.length <= 0) {
            return;
        }

        const startIndex = this.getRewardVirtualStartIndex();
        if (!force && startIndex === this.currentRewardStartIndex) {
            return;
        }

        this.currentRewardStartIndex = startIndex;
        const itemSpan = this.getRewardItemSpan();
        const itemHeight = this.getRewardItemHeight();
        const paddingTop = this.getRewardLayout()?.paddingTop ?? 0;

        for (let slotIndex = 0; slotIndex < this.rewardItemNodes.length; slotIndex++) {
            const itemNode = this.rewardItemNodes[slotIndex];
            const dataIndex = startIndex + slotIndex;
            if (dataIndex >= this.rewardItems.length) {
                itemNode.active = false;
                itemNode.getComponent(RoadReward)?.setData(null);
                this.rewardItemNodeDataIndices.delete(itemNode);
                continue;
            }

            itemNode.active = true;
            itemNode.setPosition(0, -paddingTop - (startIndex + slotIndex) * itemSpan - itemHeight * 0.5, 0);
            if (this.rewardItemNodeDataIndices.get(itemNode) !== dataIndex) {
                itemNode.getComponent(RoadReward)?.setData(this.applyClaimStateToRewardData(this.rewardItems[dataIndex]));
                this.rewardItemNodeDataIndices.set(itemNode, dataIndex);
            }
        }
    }

    private getRewardVirtualStartIndex(): number {
        if (this.rewardItems.length <= this.rewardItemNodes.length) {
            return 0;
        }

        const scrollView = this.getRewardScrollView();
        const itemSpan = this.getRewardItemSpan();
        if (!scrollView || itemSpan <= 0) {
            return 0;
        }

        const offsetY = Math.max(0, scrollView.getScrollOffset().y);
        const maxStartIndex = Math.max(0, this.rewardItems.length - this.rewardItemNodes.length);
        if (this.rewardSnapTargetY !== null) {
            return this.getRewardStartIndexByOffset(this.rewardSnapTargetY, true);
        }

        const maxOffsetY = this.getRewardMaxOffsetY();
        if (maxOffsetY > 0 && offsetY >= maxOffsetY - 1) {
            return maxStartIndex;
        }

        const nearestStartIndex = this.getRewardStartIndexByOffset(offsetY, true);
        const nearestOffsetY = nearestStartIndex * itemSpan;
        if (Math.abs(offsetY - nearestOffsetY) <= ROAD_REWARD_SNAP_INDEX_EPSILON) {
            return nearestStartIndex;
        }

        return Math.min(Math.floor(offsetY / itemSpan), maxStartIndex);
    }

    private updateRewardContentSize(): void {
        const contentTransform = this.reward_items_content?.getComponent(UITransform);
        if (!contentTransform) {
            return;
        }

        const layout = this.getRewardLayout();
        if (layout) {
            layout.enabled = false;
        }

        const itemWidth = this.getRewardItemWidth();
        const itemHeight = this.getRewardItemHeight();
        const spacingY = layout?.spacingY ?? 0;
        const paddingTop = layout?.paddingTop ?? 0;
        const paddingBottom = layout?.paddingBottom ?? 0;
        const totalCount = this.rewardItems.length;
        const totalSpacing = totalCount > 1 ? spacingY * (totalCount - 1) : 0;
        const naturalHeight = paddingTop + paddingBottom + totalCount * itemHeight + totalSpacing;
        const viewHeight = this.reward_items_content.parent?.getComponent(UITransform)?.height ?? 0;
        const maxStartIndex = Math.max(0, totalCount - Math.min(ROAD_REWARD_VISIBLE_COUNT, totalCount));
        const alignedHeight = viewHeight + maxStartIndex * this.getRewardItemSpan();
        const nextHeight = Math.max(naturalHeight, alignedHeight);

        contentTransform.setContentSize(Math.max(contentTransform.width, itemWidth), Math.max(0, nextHeight));
    }

    private scrollRewardListToTop(): void {
        this.getRewardScrollView()?.scrollToTop(0);
    }

    private getRewardScrollView(): ScrollView | null {
        return this.reward_items_content?.parent?.parent?.getComponent(ScrollView) ?? null;
    }

    private getRewardLayout(): Layout | null {
        return this.reward_items_content?.getComponent(Layout) ?? null;
    }

    private getRewardItemWidth(): number {
        const itemTransform = this.rewardItemNodes[0]?.getComponent(UITransform) ?? null;
        return itemTransform ? itemTransform.width * Math.abs(this.rewardItemNodes[0].scale.x || 1) : 0;
    }

    private getRewardItemHeight(): number {
        const itemTransform = this.rewardItemNodes[0]?.getComponent(UITransform) ?? null;
        return itemTransform ? itemTransform.height * Math.abs(this.rewardItemNodes[0].scale.y || 1) : 0;
    }

    private getRewardItemSpan(): number {
        return this.getRewardItemHeight() + (this.getRewardLayout()?.spacingY ?? 0);
    }

    private trySnapRewardScroll(force: boolean = false): void {
        if (!this.node.active || !this.reward_items_content || this.rewardItems.length <= this.rewardItemNodes.length) {
            this.rewardSnapTargetY = null;
            return;
        }

        const scrollView = this.getRewardScrollView();
        const itemSpan = this.getRewardItemSpan();
        if (!scrollView || itemSpan <= 0) {
            return;
        }

        const offsetY = Math.max(0, scrollView.getScrollOffset().y);
        if (this.isRewardScrollTouching) {
            return;
        }

        if (this.rewardSnapTargetY !== null) {
            if (Math.abs(offsetY - this.rewardSnapTargetY) <= ROAD_REWARD_SNAP_EPSILON) {
                scrollView.scrollToOffset(new Vec2(0, this.rewardSnapTargetY), 0);
                this.rewardSnapTargetY = null;
                this.updateRewardVirtualList(true);
            }
            return;
        }

        if (!force && scrollView.isAutoScrolling()) {
            return;
        }

        const snapOffsetY = this.getRewardSnapOffsetY(offsetY);
        if (Math.abs(snapOffsetY - offsetY) <= ROAD_REWARD_SNAP_EPSILON) {
            return;
        }

        this.rewardSnapTargetY = snapOffsetY;
        scrollView.stopAutoScroll();
        scrollView.scrollToOffset(new Vec2(0, snapOffsetY), 0);
        this.rewardSnapTargetY = null;
        this.updateRewardVirtualList(true);
    }

    private getRewardSnapOffsetY(offsetY: number): number {
        const itemSpan = this.getRewardItemSpan();
        if (itemSpan <= 0) {
            return 0;
        }

        const maxAlignedOffsetY = Math.max(0, this.rewardItems.length - this.rewardItemNodes.length) * itemSpan;
        const maxOffsetY = this.getRewardMaxOffsetY();
        const targetOffsetY = this.getRewardStartIndexByOffset(offsetY, true) * itemSpan;
        return Math.min(Math.max(0, targetOffsetY), maxAlignedOffsetY, maxOffsetY);
    }

    private getRewardStartIndexByOffset(offsetY: number, useNearest: boolean = false): number {
        const itemSpan = this.getRewardItemSpan();
        if (itemSpan <= 0) {
            return 0;
        }

        const maxStartIndex = Math.max(0, this.rewardItems.length - this.rewardItemNodes.length);
        const rawStartIndex = offsetY / itemSpan;
        const startIndex = useNearest ? Math.round(rawStartIndex) : Math.floor(rawStartIndex);
        return Math.min(Math.max(0, startIndex), maxStartIndex);
    }

    private getRewardMaxOffsetY(): number {
        const contentHeight = this.reward_items_content?.getComponent(UITransform)?.height ?? 0;
        const viewHeight = this.reward_items_content?.parent?.getComponent(UITransform)?.height ?? 0;
        return Math.max(0, contentHeight - viewHeight);
    }

    private applyClaimStateToRewardData(data: RoadRewardLevelData): RoadRewardLevelData {
        return {
            ...data,
            freeClaimed: this.freeClaimedLevels.has(data.level),
            premiumClaimed: this.premiumClaimedLevels.has(data.level),
            currentPassLevel: this.getCurrentPassLevel(),
            premiumPassUnlocked: this.premiumPassUnlocked,
            roadNormalBorder: this.road_normal_border,
            roadLightBorder: this.road_light_border,
            roadLockBorder: this.road_lock_border
        };
    }

    private getCurrentPassLevel(): number {
        if (this.rewardItems.length <= 0) {
            return Math.max(1, this._passLevel);
        }

        const maxLevel = this.rewardItems[this.rewardItems.length - 1]?.level ?? 0;
        return Math.min(maxLevel, Math.max(1, this._passLevel));
    }

    private getCurrentRequiredExp(): number {
        if (this.rewardItems.length <= 0) {
            return 0;
        }

        const currentPassLevel = this.getCurrentPassLevel();
        const currentRewardItem = this.rewardItems.find((item) => item.level === currentPassLevel)
            ?? this.rewardItems[this.rewardItems.length - 1];
        return Math.max(0, Math.floor(Number(currentRewardItem?.requiredExp) || 0));
    }

    private refreshPassLevelByExperience(): void {
        if (this.rewardItems.length <= 0) {
            return;
        }

        let nextPassLevel = 1;
        for (const item of this.rewardItems) {
            const requiredExp = Math.max(0, Math.floor(Number(item.requiredExp) || 0));
            if (requiredExp > 0 && this._experience >= requiredExp) {
                nextPassLevel = Math.max(nextPassLevel, item.level + 1);
            }
        }

        this._passLevel = Math.min(this.rewardItems[this.rewardItems.length - 1]?.level ?? nextPassLevel, nextPassLevel);
        this.updatePassLevelLabel();
        this.updateRoadLevelItems();
    }

    private setRewardClaimed(targetSet: Set<number>, level: number, claimed: boolean): void {
        const safeLevel = this.normalizeRewardLevel(level);
        if (safeLevel <= 0) {
            return;
        }

        if (claimed) {
            targetSet.add(safeLevel);
        } else {
            targetSet.delete(safeLevel);
        }
        this.rewardItemNodeDataIndices.clear();
        this.updateRewardClaimReminder();
        this.updateRewardVirtualList(true);
    }

    private normalizeClaimedLevels(levels: number[] | undefined): number[] {
        if (!Array.isArray(levels)) {
            return [];
        }

        return Array.from(new Set(levels.map((level) => this.normalizeRewardLevel(level)).filter((level) => level > 0)))
            .sort((a, b) => a - b);
    }

    private normalizeRewardLevel(level: number): number {
        return Math.max(0, Math.floor(Number(level) || 0));
    }

    private normalizeRewardAdWatchCount(count: number): number {
        return Math.min(
            ROAD_PASS_VIDEO_UNLOCK_REQUIRED_COUNT,
            Math.max(0, Math.floor(Number(count) || 0))
        );
    }

    private normalizeRewardLevels(levels: RoadRewardLevelData[] | undefined): RoadRewardLevelData[] {
        if (!Array.isArray(levels)) {
            return [];
        }

        return levels
            .filter((item) => !!item?.freeReward && !!item?.premiumReward)
            .map((item) => ({
                level: Math.max(1, Math.floor(Number(item.level) || 1)),
                requiredExp: Math.max(0, Math.floor(Number(item.requiredExp) || 0)),
                freeReward: {
                    imagePath: String(item.freeReward.imagePath || '').trim(),
                    count: Math.max(0, Math.floor(Number(item.freeReward.count) || 0)),
                    type: String(item.freeReward.type || '').trim()
                },
                premiumReward: {
                    imagePath: String(item.premiumReward.imagePath || '').trim(),
                    count: Math.max(0, Math.floor(Number(item.premiumReward.count) || 0)),
                    type: String(item.premiumReward.type || '').trim()
                }
            }))
            .sort((a, b) => a.level - b.level);
    }
}
