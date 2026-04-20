import { _decorator, assetManager, Color, Component, EventTouch, ImageAsset, input, Input, instantiate, isValid, Label, Layout, Node, Prefab, resources, ScrollView, Sprite, SpriteFrame, Texture2D, tween, Tween, UITransform, Vec2, Vec3 } from 'cc';
import { DifficultyMode, GameManager } from './GameManager';
import { ChartUser } from './ChartUser';
import { ChartLocalProfileContext, ChartOwnerSummaryBuilder, ChartOwnerSummaryData } from './ChartOwnerSummary';
import { DifficultySummary, LevelBest, PlayerService } from './PlayerService';
const { ccclass, property } = _decorator;

interface DifficultyRankingCache {
    data: DifficultySummary[];
    updatedAt: number;
}

interface LevelRankingCache {
    data: LevelBest[];
    updatedAt: number;
}

type ChartViewMode = 'difficulty' | 'level';
type VirtualListMode = ChartViewMode | 'placeholder';

const CACHE_TTL_MS = 60 * 1000;
const RANKING_LIMIT = 100;
const CHART_USER_PREFAB_PATH = 'chart_user';
const CHART_OPEN_SCALE_FROM = 0.5;
const CHART_OPEN_SCALE_TO = 1;
const CHART_OPEN_ANIMATION_DURATION = 0.18;
const VISIBLE_RANKING_COUNT = 8;
const VIRTUAL_LIST_BUFFER_COUNT = 2;
const VIRTUAL_LIST_NODE_COUNT = VISIBLE_RANKING_COUNT + VIRTUAL_LIST_BUFFER_COUNT * 2;

@ccclass('ChartController')
export class ChartController extends Component {
    // ==================== 难度页签 ====================
    @property({ type: Node })
    simple_tag: Node = null;

    @property({ type: Node })
    medium_tag: Node = null;

    @property({ type: Node })
    hard_tag: Node = null;

    // ==================== 头部区域 ====================
    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Sprite })
    owner_avatar_sprite: Sprite = null;

    @property({ type: Label })
    owner_name_label: Label = null;

    @property({ type: Label })
    owner_number_label: Label = null;

    @property({ type: Label })
    owner_level_label: Label = null;

    // ==================== 排行榜列表区域 ====================
    @property({ type: Node })
    content: Node = null;

    @property({ type: Node })
    chart_bg: Node = null;

    // ==================== 当前视图状态 ====================
    private currentDifficulty: DifficultyMode = DifficultyMode.SIMPLE;
    private currentLevelNo = 1;
    private currentViewMode: ChartViewMode = 'difficulty';

    // ==================== 运行期内存缓存 ====================
    private readonly rankingCache = new Map<DifficultyMode, DifficultyRankingCache>();
    private readonly levelRankingCache = new Map<string, LevelRankingCache>();
    private readonly refreshTasks = new Map<DifficultyMode, Promise<void>>();
    private readonly levelRefreshTasks = new Map<string, Promise<void>>();

    // ==================== 头像缓存 ====================
    private readonly avatarFrameCache = new Map<string, SpriteFrame | null>();
    private readonly avatarLoadTasks = new Map<string, Promise<SpriteFrame | null>>();

    // ==================== Prefab 与节点池 ====================
    private chartUserPrefab: Prefab | null = null;
    private chartUserPrefabTask: Promise<Prefab | null> | null = null;
    private chartUserPrewarmTask: Promise<void> | null = null;
    private readonly chartUserNodePool: Node[] = [];

    // ==================== 渲染状态 ====================
    private defaultOwnerAvatarSpriteFrame: SpriteFrame | null = null;
    private renderVersion = 0;
    private pendingOpenForceRefresh = false;
    private activeRankingRenderToken = 0;
    private currentRankingTotalCount = 0;
    private currentVirtualStartIndex = -1;
    private virtualListMode: VirtualListMode | null = null;
    private topSpacerNode: Node | null = null;
    private bottomSpacerNode: Node | null = null;
    private readonly virtualItemNodes: Node[] = [];

    // ==================== 生命周期 ====================
    // 初始化默认头像、按钮事件和列表资源预热。
    onLoad() {
        this.defaultOwnerAvatarSpriteFrame = this.owner_avatar_sprite?.spriteFrame ?? null;
        this.bindButtonEvents();
        void this.preloadChartUserResources();
    }

    // 打开排行榜时注册关闭手势，并按当前模式显示缓存和触发刷新。
    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        const forceRefresh = this.pendingOpenForceRefresh;
        this.pendingOpenForceRefresh = false;
        this.playOpenAnimation();
        this.showCurrentRankingOrLoading();
        void this.refreshCurrentRankingIfNeeded(forceRefresh);
    }

    // 关闭排行榜时移除全局触摸监听，并使当前渲染令牌失效。
    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.renderVersion++;
    }

    // 销毁组件时解绑事件并清理节点池。
    onDestroy() {
        this.unbindButtonEvents();
        this.clearChartUserNodePool();
    }

    // 每帧根据滚动位置刷新虚拟列表可见窗口。
    update(): void {
        this.updateVirtualList();
    }

    // ==================== 对外接口 ====================
    // 打开指定难度的排行榜页面。
    public openDifficultyRanking(difficulty: DifficultyMode = this.currentDifficulty, forceRefresh: boolean = false): void {
        this.currentViewMode = 'difficulty';
        this.currentDifficulty = difficulty;
        this.setDifficultyTagsVisible(true);
        if (!this.node.active) {
            this.pendingOpenForceRefresh = forceRefresh;
            this.node.active = true;
            return;
        }

        this.node.active = true;
        this.playOpenAnimation();
        this.showCurrentRankingOrLoading();
        void this.refreshCurrentRankingIfNeeded(forceRefresh);
    }

    // 打开指定难度和关卡的排行榜页面。
    public openLevelRanking(difficulty: DifficultyMode, levelNo: number, forceRefresh: boolean = false): void {
        this.currentViewMode = 'level';
        this.currentDifficulty = difficulty;
        this.currentLevelNo = Math.max(1, levelNo);
        this.setDifficultyTagsVisible(false);
        if (!this.node.active) {
            this.pendingOpenForceRefresh = forceRefresh;
            this.node.active = true;
            return;
        }

        this.node.active = true;
        this.playOpenAnimation();
        this.showCurrentRankingOrLoading();
        void this.refreshCurrentRankingIfNeeded(forceRefresh);
    }

    // ==================== 难度排行榜 ====================
    // 先使用内存缓存渲染当前难度排行榜，没有数据时显示占位。
    private showCachedOrLoading(difficulty: DifficultyMode = this.currentDifficulty): void {
        this.currentDifficulty = difficulty;
        this.updateDifficultyTagState();
        this.renderCurrentDifficulty();
    }

    // 当缓存过期或被强制要求时刷新指定难度排行榜。
    private async refreshIfNeeded(force: boolean = false, difficulty: DifficultyMode = this.currentDifficulty): Promise<void> {
        const cache = this.rankingCache.get(difficulty);
        if (!force && cache && !this.isCacheExpired(cache.updatedAt)) {
            return;
        }

        await this.refreshDifficultyRanking(difficulty);
    }

    // 预热排行榜资源，并批量拉取三个难度的排行榜数据。
    public async preloadAllRankings(force: boolean = false): Promise<void> {
        await this.preloadChartUserResources();
        const difficulties = [DifficultyMode.SIMPLE, DifficultyMode.MEDIUM, DifficultyMode.HARD];

        if (!force) {
            const hasFreshCache = difficulties.every((difficulty) => {
                const cache = this.rankingCache.get(difficulty);
                return !!cache && !this.isCacheExpired(cache.updatedAt);
            });
            if (hasFreshCache) {
                return;
            }
        }

        await Promise.all(difficulties.map((difficulty) => this.refreshIfNeeded(force, difficulty)));
    }

    // ==================== 排行榜入口调度 ====================
    // 根据当前视图模式渲染排行榜缓存或占位内容。
    private showCurrentRankingOrLoading(): void {
        if (this.currentViewMode === 'level') {
            this.showLevelRankingOrLoading();
            return;
        }

        this.showCachedOrLoading(this.currentDifficulty);
    }

    // 根据当前视图模式决定是否刷新排行榜数据。
    private async refreshCurrentRankingIfNeeded(force: boolean = false): Promise<void> {
        if (this.currentViewMode === 'level') {
            await this.refreshLevelRankingIfNeeded(force);
            return;
        }

        await this.refreshIfNeeded(force, this.currentDifficulty);
    }

    // ==================== 关卡排行榜 ====================
    // 使用当前关卡缓存渲染排行榜，没有数据时显示占位。
    private showLevelRankingOrLoading(): void {
        this.setDifficultyTagsVisible(false);
        this.renderCurrentLevelRanking();
    }

    // 当缓存过期或被强制要求时刷新当前关卡排行榜。
    private async refreshLevelRankingIfNeeded(force: boolean = false): Promise<void> {
        const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
        const cache = this.levelRankingCache.get(levelKey);
        if (!force && cache && !this.isCacheExpired(cache.updatedAt)) {
            return;
        }

        await this.refreshCurrentLevelRanking();
    }

    // ==================== 界面交互 ====================
    // 绑定关闭按钮和三个难度页签的点击事件。
    private bindButtonEvents(): void {
        if (this.close_btn) {
            this.close_btn.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
        if (this.simple_tag) {
            this.simple_tag.on(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        }
        if (this.medium_tag) {
            this.medium_tag.on(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        }
        if (this.hard_tag) {
            this.hard_tag.on(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        }
    }

    // 解绑关闭按钮和三个难度页签的点击事件。
    private unbindButtonEvents(): void {
        if (this.close_btn) {
            this.close_btn.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
        if (this.simple_tag) {
            this.simple_tag.off(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        }
        if (this.medium_tag) {
            this.medium_tag.off(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        }
        if (this.hard_tag) {
            this.hard_tag.off(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        }
    }

    // 切换到简单难度排行榜。
    private onSimpleTagClick(): void {
        this.switchDifficulty(DifficultyMode.SIMPLE);
    }

    // 切换到中等难度排行榜。
    private onMediumTagClick(): void {
        this.switchDifficulty(DifficultyMode.MEDIUM);
    }

    // 切换到困难难度排行榜。
    private onHardTagClick(): void {
        this.switchDifficulty(DifficultyMode.HARD);
    }

    // 切换当前难度，并尽量先复用已有缓存显示。
    private switchDifficulty(difficulty: DifficultyMode): void {
        if (this.currentDifficulty === difficulty) {
            this.showCurrentRankingOrLoading();
            void this.refreshCurrentRankingIfNeeded(false);
            return;
        }

        this.currentDifficulty = difficulty;
        this.showCurrentRankingOrLoading();
        void this.refreshCurrentRankingIfNeeded(false);
    }

    // 监听全局触摸，在点击面板外部时关闭排行榜。
    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) return;

        const touchPos = touch.getUILocation();
        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closeChart();
    }

    // 判断触摸点是否落在排行榜主体面板内部。
    private isTouchInContentPanel(touchPos: Vec2): boolean {
        if (!this.chart_bg) return false;

        const contentTransform = this.chart_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
    }

    // 响应关闭按钮点击。
    private onCloseBtnClick(): void {
        this.closeChart();
    }

    // 关闭排行榜节点。
    private closeChart(): void {
        this.node.active = false;
    }

    // 播放排行榜打开时的缩放动画。
    private playOpenAnimation(): void {
        const animationTarget = this.node;
        if (!animationTarget) return;

        Tween.stopAllByTarget(animationTarget);
        animationTarget.setScale(new Vec3(CHART_OPEN_SCALE_FROM, CHART_OPEN_SCALE_FROM, 1));
        tween(animationTarget)
            .to(
                CHART_OPEN_ANIMATION_DURATION,
                { scale: new Vec3(CHART_OPEN_SCALE_TO, CHART_OPEN_SCALE_TO, 1) },
                { easing: 'backOut' }
            )
            .start();
    }

    // ==================== 排行榜渲染入口 ====================
    // 根据当前难度缓存渲染排行榜页面主体。
    private renderCurrentDifficulty(): void {
        const cache = this.rankingCache.get(this.currentDifficulty);
        const ranking = cache?.data ?? [];
        const visibleRanking = ranking.filter((item) => item.highestLevel > 0);

        this.renderCurrentRankingView(
            visibleRanking,
            !!cache,
            'difficulty',
            (renderToken) => {
                this.applyOwnerSummary(
                    ChartOwnerSummaryBuilder.buildDifficultyOwnerSummary({
                        currentUserId: GameManager.getInstance()?.openid ?? '',
                        ranking,
                        cachedLevel: Math.max(0, (PlayerService.instance?.getCachedLevel(this.currentDifficulty) ?? 1) - 1),
                        localProfile: this.getLocalProfileContext(),
                        formatLevelText: (highestLevel) => this.formatLevelText(highestLevel)
                    }),
                    renderToken
                );
            },
            (list, renderToken) => this.renderRankingItems(list, renderToken, this.updateVirtualDifficultyWindow.bind(this))
        );
    }

    // 根据当前关卡缓存渲染排行榜页面主体。
    private renderCurrentLevelRanking(): void {
        const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
        const cache = this.levelRankingCache.get(levelKey);
        const ranking = cache?.data ?? [];

        this.renderCurrentRankingView(
            ranking,
            !!cache,
            'level',
            (renderToken) => {
                this.applyOwnerSummary(
                    ChartOwnerSummaryBuilder.buildLevelOwnerSummary({
                        currentUserId: GameManager.getInstance()?.openid ?? '',
                        ranking,
                        localProfile: this.getLocalProfileContext(),
                        formatClearTimeText: (clearTime) => this.formatClearTimeText(clearTime)
                    }),
                    renderToken
                );
            },
            (list, renderToken) => this.renderRankingItems(list, renderToken, this.updateVirtualLevelWindow.bind(this))
        );
    }

    // ==================== 通用渲染流程 ====================
    // 统一处理头部摘要、列表内容和占位提示的渲染入口。
    private renderCurrentRankingView<T>(
        ranking: T[],
        hasCache: boolean,
        listMode: Extract<VirtualListMode, 'difficulty' | 'level'>,
        renderOwnerSummary: (renderToken: number) => void,
        renderList: (ranking: T[], renderToken: number) => Promise<void>
    ): void {
        const renderToken = ++this.renderVersion;
        this.activeRankingRenderToken = renderToken;
        this.currentRankingTotalCount = ranking.length;
        this.currentVirtualStartIndex = -1;
        this.virtualListMode = ranking.length > 0 ? listMode : 'placeholder';

        renderOwnerSummary(renderToken);

        if (ranking.length > 0) {
            void renderList(ranking, renderToken);
            return;
        }

        const placeholderMessage = hasCache ? ' 暂无排行' : ' 加载中...';
        void this.renderPlaceholder(placeholderMessage, renderToken);
    }

    // 统一走虚拟列表准备流程来渲染排行榜列表内容。
    private async renderRankingItems<T>(
        ranking: T[],
        renderToken: number,
        updateWindow: (ranking: T[], renderToken: number, force?: boolean) => void
    ): Promise<void> {
        if (!(await this.prepareVirtualListRender(renderToken))) {
            return;
        }

        updateWindow(ranking, renderToken, true);
    }

    // 渲染“加载中...”或“暂无排行”的占位内容。
    private async renderPlaceholder(message: string, renderToken: number): Promise<void> {
        if (!(await this.prepareVirtualListRender(renderToken))) {
            return;
        }

        this.currentRankingTotalCount = 0;
        this.currentVirtualStartIndex = -1;
        this.virtualListMode = 'placeholder';
        this.updateVirtualPlaceholder(message);
        this.updateListLayout();
    }

    // ==================== 数据刷新 ====================
    // 请求云端并更新指定难度的排行榜缓存。
    private async refreshDifficultyRanking(difficulty: DifficultyMode): Promise<void> {
        await this.refreshRankingCache(
            this.refreshTasks,
            difficulty,
            async () => await PlayerService.instance?.getDifficultyRanking(difficulty, RANKING_LIMIT) ?? [],
            (ranking) => {
                this.rankingCache.set(difficulty, {
                    data: ranking,
                    updatedAt: Date.now(),
                });
            },
            () => this.node.active && this.currentViewMode === 'difficulty' && this.currentDifficulty === difficulty,
            () => this.renderCurrentDifficulty(),
            () => this.rankingCache.has(difficulty),
            `${difficulty} ranking`
        );
    }

    // 请求云端并更新当前关卡的排行榜缓存。
    private async refreshCurrentLevelRanking(): Promise<void> {
        const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
        await this.refreshRankingCache(
            this.levelRefreshTasks,
            levelKey,
            async () => await PlayerService.instance?.getLevelRanking(this.currentDifficulty, this.currentLevelNo, RANKING_LIMIT) ?? [],
            (ranking) => {
                this.levelRankingCache.set(levelKey, {
                    data: ranking,
                    updatedAt: Date.now(),
                });
            },
            () => this.node.active && this.currentViewMode === 'level' && this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo) === levelKey,
            () => this.renderCurrentLevelRanking(),
            () => this.levelRankingCache.has(levelKey),
            `${levelKey} ranking`
        );
    }

    // 统一处理排行榜请求、缓存写入和当前界面回刷。
    private async refreshRankingCache<K extends string, T>(
        taskMap: Map<K, Promise<void>>,
        taskKey: K,
        fetchRanking: () => Promise<T[]>,
        updateCache: (ranking: T[]) => void,
        shouldRenderCurrent: () => boolean,
        renderCurrent: () => void,
        hasCache: () => boolean,
        logLabel: string
    ): Promise<void> {
        const existingTask = taskMap.get(taskKey);
        if (existingTask) {
            await existingTask;
            return;
        }

        const task = (async () => {
            try {
                if (!PlayerService.instance) {
                    console.warn(`ChartController: PlayerService is not ready for ${logLabel} refresh`);
                    return;
                }

                const ranking = await fetchRanking();
                updateCache(ranking);

                if (shouldRenderCurrent()) {
                    renderCurrent();
                }
            } catch (error) {
                console.warn(`ChartController: failed to refresh ${logLabel}`, error);
                if (shouldRenderCurrent() && !hasCache()) {
                    renderCurrent();
                }
            }
        })();

        taskMap.set(taskKey, task);

        try {
            await task;
        } finally {
            taskMap.delete(taskKey);
        }
    }

    // ==================== 页面状态与布局 ====================
    // 根据当前难度刷新三个页签的选中状态。
    private updateDifficultyTagState(): void {
        this.setTagSelected(this.simple_tag, this.currentDifficulty === DifficultyMode.SIMPLE);
        this.setTagSelected(this.medium_tag, this.currentDifficulty === DifficultyMode.MEDIUM);
        this.setTagSelected(this.hard_tag, this.currentDifficulty === DifficultyMode.HARD);
    }

    // 控制难度页签显示，并在显示时同步选中态。
    private setDifficultyTagsVisible(visible: boolean): void {
        if (this.simple_tag) this.simple_tag.active = visible;
        if (this.medium_tag) this.medium_tag.active = visible;
        if (this.hard_tag) this.hard_tag.active = visible;

        if (visible) {
            this.updateDifficultyTagState();
        }
    }

    // 更新单个难度页签的选中视觉效果。
    private setTagSelected(tagNode: Node | null, selected: boolean): void {
        if (!tagNode) return;

        const tagSprite = tagNode.getComponent(Sprite);
        if (tagSprite) {
            tagSprite.color = selected ? new Color(255, 255, 255, 255) : new Color(200, 200, 200, 255);
        }
    }

    // 刷新列表布局，并同步更新 content 高度。
    private updateListLayout(): void {
        if (!this.content) {
            return;
        }

        this.updateContentHeight();

        const layout = this.content.getComponent(Layout);
        layout?.updateLayout();
    }

    // 按当前激活子节点重新计算 content 实际高度。
    private updateContentHeight(): void {
        const contentTransform = this.content?.getComponent(UITransform);
        if (!contentTransform) {
            return;
        }

        const layout = this.content.getComponent(Layout);
        const activeChildren = this.content.children.filter((child) => child.active);
        const childrenHeight = activeChildren.reduce((totalHeight, child) => {
            const childTransform = child.getComponent(UITransform);
            const childHeight = childTransform ? childTransform.height * Math.abs(child.scale.y || 1) : 0;
            return totalHeight + childHeight;
        }, 0);

        const spacingY = layout?.spacingY ?? 0;
        const paddingTop = layout?.paddingTop ?? 0;
        const paddingBottom = layout?.paddingBottom ?? 0;
        const totalSpacing = activeChildren.length > 1 ? spacingY * (activeChildren.length - 1) : 0;
        const nextHeight = childrenHeight + totalSpacing + paddingTop + paddingBottom;

        contentTransform.setContentSize(contentTransform.width, Math.max(nextHeight, 0));
    }

    // 将排行榜滚动位置重置到顶部。
    private scrollToTop(): void {
        const scrollView = this.getScrollView();
        scrollView?.scrollToTop(0);
    }

    // 获取排行榜列表所在的 ScrollView 组件。
    private getScrollView(): ScrollView | null {
        return this.content?.parent?.parent?.getComponent(ScrollView) ?? null;
    }

    // ==================== 虚拟列表 ====================
    // 根据滚动位置刷新虚拟列表当前可见窗口。
    private updateVirtualList(force: boolean = false): void {
        if (!this.node.active || !this.content || this.currentRankingTotalCount <= 0 || this.virtualItemNodes.length <= 0) {
            return;
        }

        const renderToken = this.activeRankingRenderToken;
        if (!renderToken || renderToken !== this.renderVersion) {
            return;
        }

        if (this.virtualListMode === 'difficulty') {
            const ranking = (this.rankingCache.get(this.currentDifficulty)?.data ?? [])
                .filter((item) => item.highestLevel > 0);
            this.updateVirtualDifficultyWindow(ranking, renderToken, force);
            return;
        }

        if (this.virtualListMode === 'level') {
            const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
            const ranking = this.levelRankingCache.get(levelKey)?.data ?? [];
            this.updateVirtualLevelWindow(ranking, renderToken, force);
        }
    }

    // 确保虚拟列表节点就绪，并在渲染前回到顶部。
    private async prepareVirtualListRender(renderToken: number): Promise<boolean> {
        const prefab = await this.preloadChartUserResources();
        if (!prefab || renderToken !== this.renderVersion || !isValid(this.content)) {
            return false;
        }

        this.ensureVirtualListNodes(prefab);
        if (renderToken !== this.renderVersion || !isValid(this.content)) {
            return false;
        }

        this.syncVirtualListChildren();
        this.scrollToTop();
        return true;
    }

    // 补齐虚拟列表所需的复用节点和上下占位节点。
    private ensureVirtualListNodes(prefab: Prefab): void {
        if (!this.content) {
            return;
        }

        if (!this.topSpacerNode) {
            this.topSpacerNode = this.createVirtualSpacerNode('chart_virtual_top_spacer');
        }
        if (!this.bottomSpacerNode) {
            this.bottomSpacerNode = this.createVirtualSpacerNode('chart_virtual_bottom_spacer');
        }

        while (this.virtualItemNodes.length < VIRTUAL_LIST_NODE_COUNT) {
            const itemNode = this.obtainChartUserNode(prefab);
            itemNode.active = true;
            this.virtualItemNodes.push(itemNode);
        }
    }

    // 创建用于占位的虚拟列表 spacer 节点。
    private createVirtualSpacerNode(name: string): Node {
        const spacerNode = new Node(name);
        spacerNode.addComponent(UITransform);
        spacerNode.active = false;
        return spacerNode;
    }

    // 让 content 子节点与虚拟列表托管节点保持一致。
    private syncVirtualListChildren(): void {
        if (!this.content || !this.topSpacerNode || !this.bottomSpacerNode) {
            return;
        }

        const managedNodes = new Set<Node>([this.topSpacerNode, this.bottomSpacerNode, ...this.virtualItemNodes]);
        const children = [...this.content.children];
        for (const child of children) {
            child.removeFromParent();
            if (managedNodes.has(child)) {
                continue;
            }
            child.active = false;
            this.chartUserNodePool.push(child);
        }

        this.content.addChild(this.topSpacerNode);
        for (const itemNode of this.virtualItemNodes) {
            this.content.addChild(itemNode);
        }
        this.content.addChild(this.bottomSpacerNode);
    }

    // 获取单个列表项按当前缩放后的实际高度。
    private getVirtualItemHeight(): number {
        const firstItemNode = this.virtualItemNodes[0] ?? null;
        const itemTransform = firstItemNode?.getComponent(UITransform) ?? null;
        return itemTransform ? itemTransform.height * Math.abs(firstItemNode.scale.y || 1) : 0;
    }

    // 获取列表项之间的垂直间距。
    private getVirtualItemSpacing(): number {
        return this.content?.getComponent(Layout)?.spacingY ?? 0;
    }

    // 获取一个列表项连同间距后的总跨度。
    private getVirtualItemSpan(): number {
        return this.getVirtualItemHeight() + this.getVirtualItemSpacing();
    }

    // 根据当前滚动偏移计算虚拟列表起始索引。
    private getVirtualStartIndex(totalCount: number): number {
        if (totalCount <= VIRTUAL_LIST_NODE_COUNT) {
            return 0;
        }

        const scrollView = this.getScrollView();
        const itemSpan = this.getVirtualItemSpan();
        if (!scrollView || itemSpan <= 0) {
            return 0;
        }

        const currentOffset = Math.max(0, scrollView.getScrollOffset().y);
        const firstVisibleIndex = Math.floor(currentOffset / itemSpan);
        const desiredStartIndex = Math.max(0, firstVisibleIndex - VIRTUAL_LIST_BUFFER_COUNT);
        const maxStartIndex = Math.max(0, totalCount - VIRTUAL_LIST_NODE_COUNT);
        return Math.min(desiredStartIndex, maxStartIndex);
    }

    // 计算被隐藏列表项需要占据的总高度。
    private getVirtualSpacerHeight(hiddenItemCount: number): number {
        if (hiddenItemCount <= 0) {
            return 0;
        }

        const itemHeight = this.getVirtualItemHeight();
        const spacingY = this.getVirtualItemSpacing();
        return hiddenItemCount * itemHeight + Math.max(0, hiddenItemCount - 1) * spacingY;
    }

    // 设置单个占位节点的显示状态和高度。
    private setVirtualSpacerHeight(spacerNode: Node | null, hiddenItemCount: number): void {
        if (!spacerNode) {
            return;
        }

        spacerNode.active = hiddenItemCount > 0;
        const spacerTransform = spacerNode.getComponent(UITransform);
        const contentTransform = this.content?.getComponent(UITransform);
        if (!spacerTransform || !contentTransform) {
            return;
        }

        spacerTransform.setContentSize(contentTransform.width, this.getVirtualSpacerHeight(hiddenItemCount));
    }

    // 按当前窗口起始索引更新上下占位节点高度。
    private updateVirtualSpacerNodes(startIndex: number, totalCount: number): void {
        const visibleCount = Math.min(VIRTUAL_LIST_NODE_COUNT, Math.max(0, totalCount - startIndex));
        const topHiddenCount = startIndex;
        const bottomHiddenCount = Math.max(0, totalCount - startIndex - visibleCount);
        this.setVirtualSpacerHeight(this.topSpacerNode, topHiddenCount);
        this.setVirtualSpacerHeight(this.bottomSpacerNode, bottomHiddenCount);
    }

    // 刷新难度排行榜当前可见区域的列表项绑定。
    private updateVirtualDifficultyWindow(ranking: DifficultySummary[], renderToken: number, force: boolean = false): void {
        const startIndex = this.getVirtualStartIndex(ranking.length);
        if (!force && startIndex === this.currentVirtualStartIndex) {
            return;
        }

        this.currentVirtualStartIndex = startIndex;
        this.updateVirtualSpacerNodes(startIndex, ranking.length);
        for (let slotIndex = 0; slotIndex < this.virtualItemNodes.length; slotIndex++) {
            const itemNode = this.virtualItemNodes[slotIndex];
            const dataIndex = startIndex + slotIndex;
            if (dataIndex >= ranking.length) {
                itemNode.active = false;
                continue;
            }

            itemNode.active = true;
            this.bindDifficultyItemNode(itemNode, ranking[dataIndex], dataIndex, renderToken);
        }

        this.updateListLayout();
    }

    // 刷新关卡排行榜当前可见区域的列表项绑定。
    private updateVirtualLevelWindow(ranking: LevelBest[], renderToken: number, force: boolean = false): void {
        const startIndex = this.getVirtualStartIndex(ranking.length);
        if (!force && startIndex === this.currentVirtualStartIndex) {
            return;
        }

        this.currentVirtualStartIndex = startIndex;
        this.updateVirtualSpacerNodes(startIndex, ranking.length);
        for (let slotIndex = 0; slotIndex < this.virtualItemNodes.length; slotIndex++) {
            const itemNode = this.virtualItemNodes[slotIndex];
            const dataIndex = startIndex + slotIndex;
            if (dataIndex >= ranking.length) {
                itemNode.active = false;
                continue;
            }

            itemNode.active = true;
            this.bindLevelItemNode(itemNode, ranking[dataIndex], dataIndex, renderToken);
        }

        this.updateListLayout();
    }

    // 将虚拟列表切换为占位提示状态。
    private updateVirtualPlaceholder(message: string): void {
        this.currentVirtualStartIndex = -1;
        this.setVirtualSpacerHeight(this.topSpacerNode, 0);
        this.setVirtualSpacerHeight(this.bottomSpacerNode, 0);

        for (let slotIndex = 0; slotIndex < this.virtualItemNodes.length; slotIndex++) {
            const itemNode = this.virtualItemNodes[slotIndex];
            if (slotIndex === 0) {
                itemNode.active = true;
                itemNode.getComponent(ChartUser)?.applyPlaceholder(message);
            } else {
                itemNode.active = false;
            }
        }
    }

    // ==================== 头部卡片与列表项绑定 ====================
    // 将玩家摘要信息写入头部 UI。
    private applyOwnerSummary(
        summaryOrName: ChartOwnerSummaryData | string,
        rankOrRenderToken: string | number,
        valueText?: string,
        avatarUrl?: string,
        renderToken?: number
    ): void {
        const summary = typeof summaryOrName === 'string'
            ? {
                nickname: summaryOrName,
                rankText: typeof rankOrRenderToken === 'string' ? rankOrRenderToken : '--',
                valueText: valueText || '--',
                avatarUrl: avatarUrl || ''
            }
            : summaryOrName;
        const currentRenderToken = typeof summaryOrName === 'string'
            ? (renderToken ?? this.renderVersion)
            : (typeof rankOrRenderToken === 'number' ? rankOrRenderToken : this.renderVersion);

        if (this.owner_name_label) {
            this.owner_name_label.string = this.formatNicknameText(summary.nickname);
        }
        if (this.owner_number_label) {
            this.owner_number_label.string = summary.rankText;
        }
        if (this.owner_level_label) {
            this.owner_level_label.string = summary.valueText;
        }

        this.resetOwnerAvatar();
        if (summary.avatarUrl) {
            this.deferApplyAvatarToSprite(this.owner_avatar_sprite, summary.avatarUrl, currentRenderToken);
        }
    }

    // 将头部头像重置为默认头像。
    private resetOwnerAvatar(): void {
        if (this.owner_avatar_sprite) {
            this.owner_avatar_sprite.spriteFrame = this.defaultOwnerAvatarSpriteFrame;
        }
    }

    // 异步加载并应用列表项头像。
    private async applyAvatarToChartUser(item: ChartUser, avatarUrl: string, renderToken: number): Promise<void> {
        const spriteFrame = await this.loadAvatarSpriteFrame(avatarUrl);
        if (!spriteFrame || renderToken !== this.renderVersion || !isValid(item?.node) || !item.isExpectingAvatar(avatarUrl)) {
            return;
        }

        item.setAvatarSpriteFrame(spriteFrame, avatarUrl);
    }

    // 绑定单个难度排行榜列表项的数据和头像。
    private bindDifficultyItemNode(itemNode: Node, itemData: DifficultySummary, dataIndex: number, renderToken: number): void {
        const item = itemNode.getComponent(ChartUser);
        if (!item) {
            return;
        }

        const profile = this.resolveDisplayProfile(itemData.userId, itemData.nickname, itemData.avatarUrl);
        item.applyRankingData(dataIndex + 1, profile.nickname, this.formatLevelText(itemData.highestLevel), profile.avatarUrl);

        if (profile.avatarUrl) {
            const cachedSpriteFrame = this.getCachedAvatarSpriteFrame(profile.avatarUrl);
            if (cachedSpriteFrame) {
                item.setAvatarSpriteFrame(cachedSpriteFrame, profile.avatarUrl);
                return;
            }
            this.deferApplyAvatarToChartUser(item, profile.avatarUrl, renderToken);
        }
    }

    // 绑定单个关卡排行榜列表项的数据和头像。
    private bindLevelItemNode(itemNode: Node, itemData: LevelBest, dataIndex: number, renderToken: number): void {
        const item = itemNode.getComponent(ChartUser);
        if (!item) {
            return;
        }

        const profile = this.resolveDisplayProfile(itemData.userId, itemData.nickname, itemData.avatarUrl);
        item.applyRankingData(dataIndex + 1, profile.nickname, this.formatClearTimeText(itemData.bestClearTime), profile.avatarUrl);

        if (profile.avatarUrl) {
            const cachedSpriteFrame = this.getCachedAvatarSpriteFrame(profile.avatarUrl);
            if (cachedSpriteFrame) {
                item.setAvatarSpriteFrame(cachedSpriteFrame, profile.avatarUrl);
                return;
            }
            this.deferApplyAvatarToChartUser(item, profile.avatarUrl, renderToken);
        }
    }

    // 延迟一帧为列表项应用头像，避免打断当前渲染流程。
    private deferApplyAvatarToChartUser(item: ChartUser | null, avatarUrl: string, renderToken: number): void {
        if (!item || !avatarUrl) {
            return;
        }

        const itemNode = item.node;
        this.scheduleOnce(() => {
            if (renderToken !== this.renderVersion || !isValid(itemNode)) {
                return;
            }
            void this.applyAvatarToChartUser(item, avatarUrl, renderToken);
        }, 0);
    }

    // 延迟一帧为头部头像应用远程图片。
    private deferApplyAvatarToSprite(sprite: Sprite | null, avatarUrl: string, renderToken: number): void {
        if (!sprite || !avatarUrl) {
            return;
        }

        const spriteNode = sprite.node;
        this.scheduleOnce(() => {
            if (renderToken !== this.renderVersion || !isValid(spriteNode)) {
                return;
            }
            void this.applyAvatarToSprite(sprite, avatarUrl, renderToken);
        }, 0);
    }

    // 异步加载并应用头部头像。
    private async applyAvatarToSprite(sprite: Sprite | null, avatarUrl: string, renderToken: number): Promise<void> {
        if (!sprite) return;

        const spriteFrame = await this.loadAvatarSpriteFrame(avatarUrl);
        if (!spriteFrame || renderToken !== this.renderVersion || !isValid(sprite.node)) {
            return;
        }

        sprite.spriteFrame = spriteFrame;
    }

    // 按缓存策略加载头像对应的 SpriteFrame。
    private async loadAvatarSpriteFrame(avatarUrl: string): Promise<SpriteFrame | null> {
        if (!avatarUrl) return null;

        const cachedSpriteFrame = this.getCachedAvatarSpriteFrame(avatarUrl);
        if (cachedSpriteFrame) {
            return cachedSpriteFrame;
        }
        if (this.avatarFrameCache.has(avatarUrl)) {
            this.avatarFrameCache.delete(avatarUrl);
        }

        const existingTask = this.avatarLoadTasks.get(avatarUrl);
        if (existingTask) {
            return await existingTask;
        }

        const task = this.loadAvatarSpriteFrameWithRetry(avatarUrl);

        this.avatarLoadTasks.set(avatarUrl, task);

        try {
            return await task;
        } finally {
            this.avatarLoadTasks.delete(avatarUrl);
        }
    }

    // 首次加载头像失败时清理远程缓存后再重试一次。
    private async loadAvatarSpriteFrameWithRetry(avatarUrl: string): Promise<SpriteFrame | null> {
        let spriteFrame = await this.loadAvatarSpriteFrameOnce(avatarUrl, false);
        if (spriteFrame) {
            this.avatarFrameCache.set(avatarUrl, spriteFrame);
            return spriteFrame;
        }

        this.clearRemoteAvatarCache(avatarUrl);
        spriteFrame = await this.loadAvatarSpriteFrameOnce(avatarUrl, true);
        if (spriteFrame) {
            this.avatarFrameCache.set(avatarUrl, spriteFrame);
        } else {
            this.avatarFrameCache.delete(avatarUrl);
        }
        return spriteFrame;
    }

    private getCachedAvatarSpriteFrame(avatarUrl: string): SpriteFrame | null {
        if (!avatarUrl || !this.avatarFrameCache.has(avatarUrl)) {
            return null;
        }

        const cachedSpriteFrame = this.avatarFrameCache.get(avatarUrl) ?? null;
        if (cachedSpriteFrame) {
            return cachedSpriteFrame;
        }

        this.avatarFrameCache.delete(avatarUrl);
        return null;
    }

    // ==================== 用户资料与头像加载 ====================
    // 合并本地授权资料和云端资料，得到最终展示信息。
    private resolveDisplayProfile(
        userId: string,
        cloudNickname?: string | null,
        cloudAvatarUrl?: string | null,
        fallbackNickname?: string
    ): { nickname: string; avatarUrl: string } {
        const profile = ChartOwnerSummaryBuilder.resolveDisplayProfile(
            userId,
            cloudNickname,
            cloudAvatarUrl,
            this.getLocalProfileContext()
        );
        return {
            nickname: profile.nickname || fallbackNickname || this.getFallbackNickname(userId),
            avatarUrl: profile.avatarUrl
        };
    }

    // 优先获取当前玩家已经授权的本地昵称和头像。
    private getLocalProfileContext(): ChartLocalProfileContext | null {
        const gameManager = GameManager.getInstance();
        const wxManager = gameManager?.wxManager;
        const openid = gameManager?.openid ?? '';
        if (!wxManager?.hasRealUserProfile() || !openid) {
            return null;
        }

        return {
            openid,
            nickname: wxManager.nickname?.trim() || '',
            avatarUrl: wxManager.avatarUrl || '',
            hasRealProfile: wxManager.hasRealUserProfile()
        };
    }

    // 执行一次远程头像下载并转成 SpriteFrame。
    private loadAvatarSpriteFrameOnce(avatarUrl: string, shouldWarn: boolean): Promise<SpriteFrame | null> {
        return new Promise<SpriteFrame | null>((resolve) => {
            const ext = this.getAvatarExtension(avatarUrl);
            assetManager.loadRemote<ImageAsset>(avatarUrl, { ext }, (err, imageAsset) => {
                if (err || !imageAsset) {
                    if (shouldWarn) {
                        console.warn(`ChartController: failed to load avatar ${avatarUrl}`, err);
                    }
                    resolve(null);
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                resolve(spriteFrame);
            });
        });
    }

    // 清理远程头像在引擎侧的缓存记录。
    private clearRemoteAvatarCache(avatarUrl: string): void {
        const cacheManager = (assetManager as any)?.cacheManager;
        cacheManager?.removeCache?.(avatarUrl);
    }

    // 根据头像地址推断远程加载时需要的扩展名。
    private getAvatarExtension(avatarUrl: string): string {
        const normalizedUrl = avatarUrl.split('?')[0].toLowerCase();
        if (normalizedUrl.includes('thirdwx.qlogo.cn') || normalizedUrl.includes('wx.qlogo.cn')) {
            return '.jpg';
        }
        if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) {
            return '.jpg';
        }
        if (normalizedUrl.endsWith('.webp')) {
            return '.webp';
        }
        if (normalizedUrl.endsWith('.png')) {
            return '.png';
        }
        return '.jpg';
    }

    // ==================== 资源预热与对象池 ====================
    // 加载排行榜列表项 Prefab 资源。
    private async loadChartUserPrefab(): Promise<Prefab | null> {
        if (this.chartUserPrefab) {
            return this.chartUserPrefab;
        }

        if (this.chartUserPrefabTask) {
            return await this.chartUserPrefabTask;
        }

        this.chartUserPrefabTask = new Promise<Prefab | null>((resolve) => {
            resources.load(CHART_USER_PREFAB_PATH, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.warn('ChartController: failed to load chart user prefab', err);
                    this.chartUserPrefabTask = null;
                    resolve(null);
                    return;
                }

                this.chartUserPrefab = prefab;
                resolve(prefab);
            });
        });

        return await this.chartUserPrefabTask;
    }

    // 预热列表 prefab 和节点池，降低首次打开卡顿。
    private async preloadChartUserResources(): Promise<Prefab | null> {
        if (this.chartUserPrefab && this.chartUserNodePool.length >= VIRTUAL_LIST_NODE_COUNT) {
            return this.chartUserPrefab;
        }

        if (this.chartUserPrewarmTask) {
            await this.chartUserPrewarmTask;
            return this.chartUserPrefab;
        }

        this.chartUserPrewarmTask = (async () => {
            const prefab = await this.loadChartUserPrefab();
            if (!prefab) {
                return;
            }

            this.prewarmChartUserNodePool(prefab);
        })();

        try {
            await this.chartUserPrewarmTask;
        } finally {
            if (!this.chartUserPrefab || this.chartUserNodePool.length < VIRTUAL_LIST_NODE_COUNT) {
                this.chartUserPrewarmTask = null;
            }
        }

        return this.chartUserPrefab;
    }

    // 预先实例化一批列表项节点放入对象池。
    private prewarmChartUserNodePool(prefab: Prefab): void {
        while (this.chartUserNodePool.length < VIRTUAL_LIST_NODE_COUNT) {
            const itemNode = instantiate(prefab);
            itemNode.active = false;
            this.chartUserNodePool.push(itemNode);
        }
    }

    // 优先从对象池取出列表项节点，不足时再新建。
    private obtainChartUserNode(prefab: Prefab): Node {
        while (this.chartUserNodePool.length > 0) {
            const cachedNode = this.chartUserNodePool.pop() ?? null;
            if (!cachedNode || !isValid(cachedNode)) {
                continue;
            }

            cachedNode.active = true;
            return cachedNode;
        }

        return instantiate(prefab);
    }

    // 销毁对象池中缓存的所有列表项节点。
    private clearChartUserNodePool(): void {
        while (this.chartUserNodePool.length > 0) {
            const cachedNode = this.chartUserNodePool.pop() ?? null;
            if (!cachedNode || !isValid(cachedNode)) {
                continue;
            }

            cachedNode.destroy();
        }
    }

    // ==================== 工具方法 ====================
    // 生成关卡排行榜缓存使用的唯一 key。
    private getLevelRankingKey(difficulty: DifficultyMode, levelNo: number): string {
        return `${difficulty}#${levelNo}`;
    }

    // 判断缓存时间是否已经超过有效期。
    private isCacheExpired(updatedAt: number): boolean {
        return Date.now() - updatedAt > CACHE_TTL_MS;
    }

    // 为缺失昵称的玩家生成默认昵称。
    private getFallbackNickname(userId: string): string {
        if (!userId) return '\u8c46\u53cb';
        return `\u8c46\u53cb${userId.slice(-4)}`;
    }

    // 将最高关卡格式化为展示文本。
    private formatLevelText(highestLevel: number): string {
        return ` \u7b2c${highestLevel}\u5173`;
    }

    // 将通关时间格式化为展示文本。
    private formatClearTimeText(clearTime: number): string {
        return clearTime >= 0 ? ` ${clearTime}s` : ' --';
    }

    // 统一处理昵称前缀空格的展示格式。
    private formatNicknameText(nickname: string): string {
        return ` ${nickname}`;
    }
}
