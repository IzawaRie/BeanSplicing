import { _decorator, Color, Component, EventTouch, input, Input, instantiate, JsonAsset, Label, Layout, Node, Prefab, resources, Sprite, SpriteFrame, tween, Tween, UITransform, Vec2, Vec3 } from 'cc';
import { BookItem } from './BookItem';
import { DifficultyMode, GameManager, GameState } from './GameManager';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
import { RewardController } from './RewardController';
const { ccclass, property } = _decorator;

type BookDifficulty = 'simple' | 'medium' | 'hard';

type BookConfigItem = {
    levelId: number;
    imagePath: string;
    type: string;
};

type BookConfigFile = Record<BookDifficulty, BookConfigItem[]>;
type BookTypeFilter = 'all' | string;

type BookRewardItem = {
    imagePath: string;
    count: number;
    type: string;
};

type BookProgressRewardItem = {
    progress: number;
    rewards: BookRewardItem[];
};

type BookProgressRewardConfigFile = Record<BookDifficulty, BookProgressRewardItem[]>;

const BOOK_CONFIG_PATH = 'book/book_config';
const BOOK_PROGRESS_REWARD_CONFIG_PATH = 'book/book_progress_reward_config';
const TYPE_TAG_PREFAB_PATH = 'tu_type_tag';
const BOOK_PAGE_SIZE = 12;
const GIFT_REMINDER_SCALE = 1.2;
const SELECTED_TYPE_TAG_COLOR = new Color(252, 158, 121, 255);
const NORMAL_TYPE_TAG_COLOR = new Color(255, 255, 255, 255);
const DIFFICULTY_TITLE_TEXT: Record<BookDifficulty, string> = {
    simple: '简单难度',
    medium: '进阶难度',
    hard: '高手难度'
};
const DIFFICULTY_TITLE_COLOR: Record<BookDifficulty, Color> = {
    simple: new Color(62, 167, 18, 255),
    medium: new Color(31, 67, 143, 255),
    hard: new Color(202, 75, 12, 255)
};
const TYPE_TAG_TEXT: Record<string, string> = {
    all: '全部',
    animal: '动物',
    food: '美食',
    plant: '植物',
    character: '角色',
    object: '物品'
};
const TYPE_TAG_ORDER = ['animal', 'food', 'plant', 'character', 'object'];
const BOOK_DIFFICULTIES: BookDifficulty[] = ['simple', 'medium', 'hard'];

@ccclass('BookController')
export class BookController extends Component {
    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Node })
    border_bg: Node = null;

    @property({ type: Node })
    progress_icons: Node = null;

    @property({ type: Node })
    type_tag_content: Node = null;

    @property({ type: Node })
    tu_simple_tag: Node = null;

    @property({ type: Node })
    tu_medium_tag: Node = null;

    @property({ type: Node })
    tu_hard_tag: Node = null;

    @property({ type: Node })
    tu_items: Node = null;

    @property({ type: Node })
    tu_jindu_icons: Node = null;

    @property({ type: Node })
    tu_gift: Node = null;

    @property({ type: Node })
    tu_gift_label_node: Node = null;

    @property({ type: Node })
    tu_switch_last_btn: Node = null;

    @property({ type: Node })
    tu_switch_next_btn: Node = null;

    @property({ type: Label })
    progress_label: Label = null;

    @property({ type: Label })
    tu_shaixuan_title: Label = null;

    @property({ type: Label })
    tu_jindu_title: Label = null;

    @property({ type: Label })
    tu_jindu_label: Label = null;

    @property({ type: Label })
    tu_pages_label: Label = null;

    @property({ type: SpriteFrame })
    tu_simple_tag_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_simple_tag_selected: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_medium_tag_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_medium_tag_selected: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_hard_tag_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_hard_tag_selected: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_green: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_blue: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_orange: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_item_bg_unlocked: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_item_bg_locked: SpriteFrame = null;

    @property({ type: RewardController })
    reward_controller: RewardController = null;

    private book_items: BookItem[] = [];
    private currentDifficulty: BookDifficulty = 'simple';
    private currentType: BookTypeFilter = 'all';
    private currentPage = 0;
    private bookConfig: BookConfigFile = {
        simple: [],
        medium: [],
        hard: []
    };
    private bookProgressRewardConfig: BookProgressRewardConfigFile = {
        simple: [],
        medium: [],
        hard: []
    };
    private unlockedBookIds: Record<BookDifficulty, Set<number>> = {
        simple: new Set<number>(),
        medium: new Set<number>(),
        hard: new Set<number>()
    };
    private localClaimedProgressRewards: Record<BookDifficulty, Set<number>> = {
        simple: new Set<number>(),
        medium: new Set<number>(),
        hard: new Set<number>()
    };
    private typeTagNodes: Node[] = [];
    private typeTagPrefab: Prefab | null = null;
    private typeTagPrefabTask: Promise<Prefab | null> | null = null;
    private typeTagRenderVersion = 0;
    private giftReminderVersion = 0;
    private giftBaseScale: Vec3 | null = null;
    private isGiftReminderAnimating = false;
    private isShowingBookVideoAd = false;

    onLoad() {
        if (this.reward_controller?.node) {
            this.reward_controller.node.active = false;
            this.reward_controller.setCloseHandler(() => this.onRewardControllerClosed());
        }
        this.captureGiftBaseScale();
        this.bindButtonEvents();
        this.initializeBookItems();
        this.selectDifficulty('simple');
        void this.loadBookConfig();
        void this.loadBookProgressRewardConfig();
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        void this.renderTypeTags();
        void this.refreshFromStorage();
        void this.refreshGiftEntryState();
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.stopGiftReminderAnimation();
    }

    start() {
    }

    update(_deltaTime: number) {
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.stopGiftReminderAnimation();
        this.clearTypeTags();
        this.unbindButtonEvents();
    }

    private initializeBookItems(): void {
        this.book_items.length = 0;
        const itemRoot = this.tu_items;
        if (!itemRoot) {
            return;
        }

        for (let i = 0; i < itemRoot.children.length; i++) {
            const bookItem = itemRoot.children[i].getComponent(BookItem);
            if (bookItem) {
                this.book_items.push(bookItem);
            }
        }
    }

    private bindButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.tu_switch_last_btn?.on(Node.EventType.TOUCH_END, this.onSwitchLastBtnClick, this);
        this.tu_switch_next_btn?.on(Node.EventType.TOUCH_END, this.onSwitchNextBtnClick, this);
        this.tu_simple_tag?.on(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        this.tu_medium_tag?.on(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        this.tu_hard_tag?.on(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        this.tu_gift?.on(Node.EventType.TOUCH_END, this.onGiftClick, this);
    }

    private unbindButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.tu_switch_last_btn?.off(Node.EventType.TOUCH_END, this.onSwitchLastBtnClick, this);
        this.tu_switch_next_btn?.off(Node.EventType.TOUCH_END, this.onSwitchNextBtnClick, this);
        this.tu_simple_tag?.off(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        this.tu_medium_tag?.off(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        this.tu_hard_tag?.off(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        this.tu_gift?.off(Node.EventType.TOUCH_END, this.onGiftClick, this);
    }

    private onCloseBtnClick(): void {
        this.playClickSound();
        this.closePanel();
    }

    private onSwitchLastBtnClick(): void {
        if (this.isRewardPopupOpen() || this.currentPage <= 0) {
            return;
        }

        this.playClickSound();
        this.currentPage--;
        this.refreshBookItems();
    }

    private onSwitchNextBtnClick(): void {
        if (this.isRewardPopupOpen()) {
            return;
        }

        const maxPage = this.getMaxPage();
        if (this.currentPage >= maxPage - 1) {
            return;
        }

        this.playClickSound();
        this.currentPage++;
        this.refreshBookItems();
    }

    private onSimpleTagClick(): void {
        if (this.isRewardPopupOpen()) {
            return;
        }

        this.playClickSound();
        this.selectDifficulty('simple');
    }

    private onMediumTagClick(): void {
        if (this.isRewardPopupOpen()) {
            return;
        }

        this.playClickSound();
        this.selectDifficulty('medium');
    }

    private onHardTagClick(): void {
        if (this.isRewardPopupOpen()) {
            return;
        }

        this.playClickSound();
        this.selectDifficulty('hard');
    }

    private async onGiftClick(): Promise<void> {
        if (this.isRewardPopupOpen() || !this.tu_gift?.active) {
            return;
        }

        this.playClickSound();
        this.giftReminderVersion++;
        this.stopGiftReminderAnimation();
        await this.refreshRewardController();
        this.reward_controller?.open();
    }

    private onRewardControllerClosed(): void {
        void this.refreshGiftEntryState();
    }

    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch || !this.node.activeInHierarchy) {
            return;
        }

        if (this.isRewardPopupOpen()) {
            return;
        }

        const touchPos = touch.getUILocation();
        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closePanel();
    }

    public closePanel(): void {
        this.stopGiftReminderAnimation();
        if (this.reward_controller?.node) {
            this.reward_controller.node.active = false;
        }
        this.node.active = false;
    }

    private async loadBookConfig(): Promise<void> {
        const config = await new Promise<BookConfigFile | null>((resolve) => {
            resources.load(BOOK_CONFIG_PATH, JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn(`BookController: failed to load ${BOOK_CONFIG_PATH}`, err);
                    resolve(null);
                    return;
                }

                resolve((jsonAsset.json || {}) as BookConfigFile);
            });
        });

        if (!config) {
            this.refreshBookItems();
            return;
        }

        this.bookConfig = {
            simple: this.shuffleBookConfigItems(Array.isArray(config.simple) ? config.simple : [], 'simple'),
            medium: this.shuffleBookConfigItems(Array.isArray(config.medium) ? config.medium : [], 'medium'),
            hard: this.shuffleBookConfigItems(Array.isArray(config.hard) ? config.hard : [], 'hard')
        };
        void this.renderTypeTags();
        void this.refreshFromStorage();
    }

    private shuffleBookConfigItems(items: BookConfigItem[], difficulty: BookDifficulty): BookConfigItem[] {
        return [...items].sort((left, right) => {
            const leftWeight = this.getStableBookItemShuffleWeight(left, difficulty);
            const rightWeight = this.getStableBookItemShuffleWeight(right, difficulty);
            if (leftWeight !== rightWeight) {
                return leftWeight - rightWeight;
            }

            return left.levelId - right.levelId;
        });
    }

    private getStableBookItemShuffleWeight(item: BookConfigItem, difficulty: BookDifficulty): number {
        const key = `${difficulty}:${item.levelId}:${item.imagePath}:${item.type}`;
        let hash = 2166136261;
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    private async loadBookProgressRewardConfig(): Promise<void> {
        const config = await new Promise<BookProgressRewardConfigFile | null>((resolve) => {
            resources.load(BOOK_PROGRESS_REWARD_CONFIG_PATH, JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn(`BookController: failed to load ${BOOK_PROGRESS_REWARD_CONFIG_PATH}`, err);
                    resolve(null);
                    return;
                }

                resolve((jsonAsset.json || {}) as BookProgressRewardConfigFile);
            });
        });

        if (!config) {
            return;
        }

        this.bookProgressRewardConfig = {
            simple: this.normalizeProgressRewards(config.simple),
            medium: this.normalizeProgressRewards(config.medium),
            hard: this.normalizeProgressRewards(config.hard)
        };
        void this.refreshGiftEntryState();
    }

    public async refreshFromStorage(): Promise<void> {
        await this.refreshAllUnlockedBookIds();
        this.refreshBookItems();
        this.refreshProgress();
    }

    private selectDifficulty(difficulty: BookDifficulty): void {
        this.currentDifficulty = difficulty;
        this.currentType = 'all';
        this.currentPage = 0;
        this.refreshDifficultyTags();
        this.refreshDifficultyTitle();
        void this.renderTypeTags();
        void this.refreshFromStorage();
        void this.refreshGiftEntryState();
    }

    private selectType(type: BookTypeFilter): void {
        if (this.isRewardPopupOpen() || this.currentType === type) {
            return;
        }

        this.playClickSound();
        this.currentType = type;
        this.currentPage = 0;
        this.refreshTypeTagColors();
        this.refreshBookItems();
    }

    private refreshDifficultyTags(): void {
        this.setTagSprite(this.tu_simple_tag, this.currentDifficulty === 'simple' ? this.tu_simple_tag_selected : this.tu_simple_tag_normal);
        this.setTagSprite(this.tu_medium_tag, this.currentDifficulty === 'medium' ? this.tu_medium_tag_selected : this.tu_medium_tag_normal);
        this.setTagSprite(this.tu_hard_tag, this.currentDifficulty === 'hard' ? this.tu_hard_tag_selected : this.tu_hard_tag_normal);
    }

    private refreshDifficultyTitle(): void {
        const difficultyText = DIFFICULTY_TITLE_TEXT[this.currentDifficulty];
        if (this.tu_shaixuan_title) {
            this.tu_shaixuan_title.string = difficultyText;
            this.tu_shaixuan_title.color = DIFFICULTY_TITLE_COLOR[this.currentDifficulty];
        }

        if (this.tu_jindu_title) {
            this.tu_jindu_title.string = `${difficultyText}收集进度:`;
        }
    }

    private setTagSprite(tagNode: Node | null, spriteFrame: SpriteFrame | null): void {
        const sprite = tagNode?.getComponent(Sprite);
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    private refreshBookItems(): void {
        const items = this.getFilteredBookItems();
        const maxPage = this.getMaxPage();
        this.currentPage = Math.min(Math.max(this.currentPage, 0), maxPage - 1);

        const startIndex = this.currentPage * BOOK_PAGE_SIZE;
        for (let i = 0; i < this.book_items.length; i++) {
            const bookItem = this.book_items[i];
            const data = i < BOOK_PAGE_SIZE ? items[startIndex + i] : null;
            const difficulty = this.currentDifficulty;
            const unlocked = !!data && this.isBookItemUnlocked(data);
            bookItem.setImage(
                data?.imagePath ?? '',
                unlocked,
                this.tu_item_bg_unlocked,
                this.tu_item_bg_locked,
                data && !unlocked ? () => this.onBookItemVideoUnlock(difficulty, data.levelId) : null
            );
        }

        this.refreshPageDisplay(maxPage);
        this.refreshSwitchButtons(maxPage);
        this.refreshProgress();
    }

    private refreshPageDisplay(maxPage: number): void {
        if (this.tu_pages_label) {
            this.tu_pages_label.string = `${this.currentPage + 1}/${maxPage}`;
        }
    }

    private refreshSwitchButtons(maxPage: number): void {
        if (this.tu_switch_last_btn) {
            this.tu_switch_last_btn.active = this.currentPage > 0;
        }
        if (this.tu_switch_next_btn) {
            this.tu_switch_next_btn.active = this.currentPage < maxPage - 1;
        }
    }

    private getCurrentDifficultyItems(): BookConfigItem[] {
        return this.bookConfig[this.currentDifficulty] || [];
    }

    private getFilteredBookItems(): BookConfigItem[] {
        const items = this.getCurrentDifficultyItems();
        if (this.currentType === 'all') {
            return items;
        }

        return items.filter((item) => item.type === this.currentType);
    }

    private getMaxPage(): number {
        return Math.max(1, Math.ceil(this.getFilteredBookItems().length / BOOK_PAGE_SIZE));
    }

    private async refreshUnlockedBookIds(difficulty: BookDifficulty): Promise<void> {
        const difficultyMode = this.toDifficultyMode(difficulty);
        let ids = await WXManager.instance?.getBookUnlockedIdsByDifficulty(difficultyMode) ?? null;
        if (!ids) {
            ids = this.getPreviewUnlockedIds(difficultyMode);
        }
        this.unlockedBookIds[difficulty] = new Set(ids);
    }

    private async refreshAllUnlockedBookIds(): Promise<void> {
        await Promise.all(BOOK_DIFFICULTIES.map((difficulty) => this.refreshUnlockedBookIds(difficulty)));
    }

    private refreshProgress(): void {
        this.refreshTotalProgress();
        this.refreshCurrentDifficultyProgress();
        void this.refreshRewardController();
        void this.refreshGiftEntryState();
    }

    private refreshTotalProgress(): void {
        const totalCount = this.getTotalBookCount();
        const collectedCount = this.getTotalUnlockedBookCount();
        const percent = this.getProgressPercent(collectedCount, totalCount);

        if (this.progress_label) {
            this.progress_label.string = `${collectedCount}/${totalCount}`;
        }
        this.refreshProgressIcons(this.progress_icons, percent, this.tu_progress_sp_green);
    }

    private refreshCurrentDifficultyProgress(): void {
        const totalCount = this.getDifficultyBookCount(this.currentDifficulty);
        const collectedCount = this.getUnlockedBookCount(this.currentDifficulty);
        const percent = this.getProgressPercent(collectedCount, totalCount);

        if (this.tu_jindu_label) {
            this.tu_jindu_label.string = ` ${collectedCount}/${totalCount}`;
        }
        this.refreshProgressIcons(this.tu_jindu_icons, percent, this.getCurrentDifficultyProgressSprite());
    }

    private refreshProgressIcons(iconRoot: Node | null, percent: number, activeSpriteFrame: SpriteFrame | null): void {
        if (!iconRoot || !this.tu_progress_sp_normal) {
            return;
        }

        const activeCount = Math.floor(percent / 5);
        for (let i = 0; i < iconRoot.children.length; i++) {
            const sprite = iconRoot.children[i].getComponent(Sprite);
            if (!sprite) {
                continue;
            }

            const shouldActive = i < activeCount;
            const spriteFrame = shouldActive ? activeSpriteFrame : this.tu_progress_sp_normal;
            if (spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        }
    }

    private getCurrentDifficultyProgressSprite(): SpriteFrame | null {
        switch (this.currentDifficulty) {
            case 'simple':
                return this.tu_progress_sp_green;
            case 'medium':
                return this.tu_progress_sp_blue;
            case 'hard':
                return this.tu_progress_sp_orange;
        }
    }

    private getTotalBookCount(): number {
        return BOOK_DIFFICULTIES.reduce((sum, difficulty) => sum + this.getDifficultyBookCount(difficulty), 0);
    }

    private getDifficultyBookCount(difficulty: BookDifficulty): number {
        return this.bookConfig[difficulty]?.length ?? 0;
    }

    private getTotalUnlockedBookCount(): number {
        return BOOK_DIFFICULTIES.reduce((sum, difficulty) => sum + this.getUnlockedBookCount(difficulty), 0);
    }

    private getUnlockedBookCount(difficulty: BookDifficulty): number {
        const difficultyItems = this.bookConfig[difficulty] || [];
        const unlockedIds = this.unlockedBookIds[difficulty];
        let count = 0;
        for (const item of difficultyItems) {
            if (unlockedIds.has(item.levelId)) {
                count++;
            }
        }
        return count;
    }

    private getProgressPercent(collectedCount: number, totalCount: number): number {
        if (totalCount <= 0) {
            return 0;
        }
        return Math.min(100, Math.max(0, Math.floor(collectedCount / totalCount * 100)));
    }

    private async refreshRewardController(): Promise<void> {
        if (!this.reward_controller) {
            return;
        }

        const totalCount = this.getDifficultyBookCount(this.currentDifficulty);
        const collectedCount = this.getUnlockedBookCount(this.currentDifficulty);
        const difficulty = this.currentDifficulty;
        const claimedProgresses = await this.getClaimedBookProgressRewards(difficulty);
        await this.reward_controller.refreshData(
            DIFFICULTY_TITLE_TEXT[difficulty],
            DIFFICULTY_TITLE_COLOR[difficulty],
            collectedCount,
            totalCount,
            this.bookProgressRewardConfig[difficulty] || [],
            claimedProgresses,
            (progress, rewards) => this.onBookProgressRewardClaim(difficulty, progress, rewards)
        );
    }

    private async getClaimedBookProgressRewards(difficulty: BookDifficulty): Promise<number[]> {
        const cachedProgresses = await WXManager.instance?.getBookProgressRewardClaimedProgressesByDifficulty(this.toDifficultyMode(difficulty)) ?? [];
        return Array.from(new Set([...cachedProgresses, ...this.localClaimedProgressRewards[difficulty]]))
            .sort((a, b) => a - b);
    }

    private onBookProgressRewardClaim(difficulty: BookDifficulty, progress: number, rewards: BookRewardItem[]): void {
        const safeProgress = Math.max(0, Math.floor(Number(progress) || 0));
        if (safeProgress > 0) {
            this.localClaimedProgressRewards[difficulty].add(safeProgress);
        }
        GameManager.getInstance()?.claimBookProgressReward(this.toDifficultyMode(difficulty), progress, rewards);
    }

    private async refreshGiftReminderAnimation(): Promise<void> {
        const refreshVersion = ++this.giftReminderVersion;
        const nextReward = await this.getNextDisplayableProgressReward(this.currentDifficulty);
        const shouldShowGiftEntry = !!nextReward;
        const shouldAnimate = shouldShowGiftEntry && this.isProgressRewardReached(nextReward);
        if (refreshVersion !== this.giftReminderVersion || !this.node.activeInHierarchy) {
            return;
        }

        this.setGiftEntryVisible(shouldShowGiftEntry);
        if (shouldAnimate) {
            this.startGiftReminderAnimation();
        } else {
            this.stopGiftReminderAnimation();
        }
    }

    private async refreshGiftEntryState(): Promise<void> {
        await this.refreshGiftReminderAnimation();
    }

    private async getNextDisplayableProgressReward(difficulty: BookDifficulty): Promise<BookProgressRewardItem | null> {
        const rewards = this.bookProgressRewardConfig[difficulty] || [];
        if (rewards.length <= 0) {
            return null;
        }

        const claimedProgresses = await this.getClaimedBookProgressRewards(difficulty);
        const claimedProgressSet = new Set(claimedProgresses);
        return rewards.find((reward) => !claimedProgressSet.has(reward.progress)) ?? null;
    }

    private isProgressRewardReached(reward: BookProgressRewardItem): boolean {
        return this.getUnlockedBookCount(this.currentDifficulty) >= reward.progress && !this.isRewardPopupOpen();
    }

    private setGiftEntryVisible(visible: boolean): void {
        if (this.tu_gift) {
            this.tu_gift.active = visible;
        }
        if (this.tu_gift_label_node) {
            this.tu_gift_label_node.active = visible;
        }
    }

    private startGiftReminderAnimation(): void {
        if (!this.tu_gift || this.isGiftReminderAnimating) {
            return;
        }

        this.captureGiftBaseScale();
        const baseScale = this.giftBaseScale ?? this.tu_gift.scale.clone();
        const targetScale = new Vec3(
            baseScale.x * GIFT_REMINDER_SCALE,
            baseScale.y * GIFT_REMINDER_SCALE,
            baseScale.z
        );

        this.isGiftReminderAnimating = true;
        Tween.stopAllByTarget(this.tu_gift);
        this.tu_gift.setScale(baseScale);
        tween(this.tu_gift)
            .to(0.45, { scale: targetScale })
            .to(0.45, { scale: baseScale })
            .union()
            .repeatForever()
            .start();
    }

    private stopGiftReminderAnimation(): void {
        if (!this.tu_gift) {
            return;
        }

        Tween.stopAllByTarget(this.tu_gift);
        if (this.giftBaseScale) {
            this.tu_gift.setScale(this.giftBaseScale);
        }
        this.isGiftReminderAnimating = false;
    }

    private captureGiftBaseScale(): void {
        if (!this.tu_gift || this.giftBaseScale) {
            return;
        }

        this.giftBaseScale = this.tu_gift.scale.clone();
    }

    private isRewardPopupOpen(): boolean {
        return !!this.reward_controller?.node?.activeInHierarchy;
    }

    private normalizeProgressRewards(rewards: BookProgressRewardItem[] | undefined): BookProgressRewardItem[] {
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

    private isBookItemUnlocked(data: BookConfigItem): boolean {
        return this.unlockedBookIds[this.currentDifficulty].has(data.levelId);
    }

    private onBookItemVideoUnlock(difficulty: BookDifficulty, levelId: number): void {
        if (this.isRewardPopupOpen() || this.unlockedBookIds[difficulty].has(levelId) || this.isShowingBookVideoAd) {
            return;
        }

        this.playClickSound();
        const wxManager = WXManager.instance;
        if (!wxManager) {
            this.unlockBookItemByVideo(difficulty, levelId);
            return;
        }

        this.isShowingBookVideoAd = true;
        wxManager.showRewardedVideoAd((success) => {
            this.isShowingBookVideoAd = false;
            if (!success) {
                return;
            }

            this.unlockBookItemByVideo(difficulty, levelId);
        });
    }

    private unlockBookItemByVideo(difficulty: BookDifficulty, levelId: number): void {
        const safeLevelId = Math.floor(Number(levelId) || 0);
        if (safeLevelId <= 0) {
            return;
        }

        this.unlockedBookIds[difficulty].add(safeLevelId);
        WXManager.instance?.addBookUnlockedIdsByDifficulty(this.toDifficultyMode(difficulty), [safeLevelId]);
        this.refreshBookItems();
        this.refreshProgress();
    }

    private toDifficultyMode(difficulty: BookDifficulty): DifficultyMode {
        switch (difficulty) {
            case 'simple':
                return DifficultyMode.SIMPLE;
            case 'medium':
                return DifficultyMode.MEDIUM;
            case 'hard':
                return DifficultyMode.HARD;
        }
    }

    private getPreviewUnlockedIds(difficulty: DifficultyMode): number[] {
        const gameManager = GameManager.getInstance();
        const currentLevel = this.getGameManagerLevelByDifficulty(gameManager, difficulty);
        const maxUnlockedLevel = Math.max(0, currentLevel - 1);
        const ids: number[] = [];
        for (let id = 1; id <= maxUnlockedLevel; id++) {
            ids.push(id);
        }
        return ids;
    }

    private getGameManagerLevelByDifficulty(gameManager: GameManager | null, difficulty: DifficultyMode): number {
        if (!gameManager) {
            return 1;
        }

        const previousDifficulty = gameManager.currentDifficulty;
        gameManager.currentDifficulty = difficulty;
        const level = gameManager.currentLevel;
        gameManager.currentDifficulty = previousDifficulty;
        return Math.max(1, Math.floor(Number(level) || 1));
    }

    private async renderTypeTags(): Promise<void> {
        if (!this.type_tag_content) {
            return;
        }

        const renderVersion = ++this.typeTagRenderVersion;
        const prefab = await this.loadTypeTagPrefab();
        if (!prefab || renderVersion !== this.typeTagRenderVersion || !this.node.activeInHierarchy) {
            return;
        }

        this.clearTypeTags();
        const types = this.getCurrentTypeTags();
        for (const type of types) {
            const tagNode = instantiate(prefab);
            tagNode.parent = this.type_tag_content;
            tagNode.name = `tu_type_tag_${type}`;
            this.setTypeTagLabel(tagNode, this.getTypeTagText(type));
            tagNode.on(Node.EventType.TOUCH_END, () => this.selectType(type), this);
            this.typeTagNodes.push(tagNode);
        }

        if (types.indexOf(this.currentType) < 0) {
            this.currentType = 'all';
            this.currentPage = 0;
            this.refreshBookItems();
        }
        this.resizeTypeTagContent();
        this.refreshTypeTagColors();
    }

    private clearTypeTags(): void {
        this.typeTagNodes.length = 0;

        if (!this.type_tag_content) {
            return;
        }

        for (let i = this.type_tag_content.children.length - 1; i >= 0; i--) {
            this.type_tag_content.children[i].destroy();
        }
    }

    private getCurrentTypeTags(): BookTypeFilter[] {
        const typeSet = new Set<string>();
        for (const item of this.getCurrentDifficultyItems()) {
            if (item.type) {
                typeSet.add(item.type);
            }
        }

        const sortedTypes = TYPE_TAG_ORDER.filter((type) => typeSet.has(type));
        const extraTypes = Array.from(typeSet)
            .filter((type) => TYPE_TAG_ORDER.indexOf(type) < 0)
            .sort();
        return ['all', ...sortedTypes, ...extraTypes];
    }

    private refreshTypeTagColors(): void {
        for (const tagNode of this.typeTagNodes) {
            const type = this.getTypeFromTagNode(tagNode);
            const sprite = tagNode.getComponent(Sprite);
            if (sprite) {
                sprite.color = type === this.currentType ? SELECTED_TYPE_TAG_COLOR : NORMAL_TYPE_TAG_COLOR;
            }
        }
    }

    private resizeTypeTagContent(): void {
        const contentTransform = this.type_tag_content?.getComponent(UITransform);
        if (!contentTransform) {
            return;
        }

        const layout = this.type_tag_content.getComponent(Layout);
        let totalWidth = (layout?.paddingLeft ?? 0) + (layout?.paddingRight ?? 0);
        for (let i = 0; i < this.typeTagNodes.length; i++) {
            const tagTransform = this.typeTagNodes[i].getComponent(UITransform);
            totalWidth += tagTransform?.width ?? 0;
            if (i < this.typeTagNodes.length - 1) {
                totalWidth += layout?.spacingX ?? 0;
            }
        }

        contentTransform.setContentSize(Math.max(0, totalWidth), contentTransform.height);
    }

    private getTypeFromTagNode(tagNode: Node): BookTypeFilter {
        return tagNode.name.replace(/^tu_type_tag_/, '') || 'all';
    }

    private setTypeTagLabel(tagNode: Node, text: string): void {
        const label = tagNode.getChildByName('tu_type_tag_label')?.getComponent(Label);
        if (label) {
            label.string = text;
        }
    }

    private getTypeTagText(type: BookTypeFilter): string {
        return TYPE_TAG_TEXT[type] || type;
    }

    private playClickSound(): void {
        AudioManager.instance?.playEffect('click_btn');
    }

    private async loadTypeTagPrefab(): Promise<Prefab | null> {
        if (this.typeTagPrefab) {
            return this.typeTagPrefab;
        }
        if (this.typeTagPrefabTask) {
            return await this.typeTagPrefabTask;
        }

        this.typeTagPrefabTask = new Promise<Prefab | null>((resolve) => {
            resources.load(TYPE_TAG_PREFAB_PATH, Prefab, (err, prefab) => {
                this.typeTagPrefabTask = null;
                if (err || !prefab) {
                    console.warn(`BookController: failed to load ${TYPE_TAG_PREFAB_PATH}`, err);
                    resolve(null);
                    return;
                }

                this.typeTagPrefab = prefab;
                resolve(prefab);
            });
        });

        return await this.typeTagPrefabTask;
    }

    private isTouchInContentPanel(touchPos: Vec2): boolean {
        const contentNode = this.border_bg ?? this.node.getChildByName('tu_bg');
        if (!contentNode) {
            return false;
        }

        const contentTransform = contentNode.getComponent(UITransform);
        if (!contentTransform) {
            return false;
        }

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
    }
}
