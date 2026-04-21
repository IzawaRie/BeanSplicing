import { _decorator, Component, Label, Node, Sprite, tween, UIOpacity, Color, resources, Prefab, instantiate, UITransform, Widget, Vec3 } from 'cc';
import { GameMode, GameModeType} from './GameMode';
import { GridDrawer } from './GridDrawer';
import { IronController } from './IronController';
import { CircleListController } from './CircleListController';
import { PaletteGenerator } from './PaletteGenerator';
import { PixelPatternApplier } from './PixelPatternApplier';
import { GameManager, GameState, DifficultyMode } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { ResultPanel } from './ResultPanel';
import { WXManager } from './WXManager';
import { LevelConfig } from './LevelConfig';
import { AudioManager } from './AudioManager';
import { SkillController } from './SkillController';
import { TutorialController } from './TutorialController';
import { CircleController } from './CircleController';

const { ccclass, property } = _decorator;

/**
 * 闯关模式
 * 按顺序通关，有步数限制和目标分数
 */
@ccclass('LevelMode')
export class LevelMode extends GameMode {
    static readonly MODE_TYPE = GameModeType.LEVEL;

    @property({ type: Node })
    up_content: Node = null;

    @property({ type: Node })
    settingBtn: Node = null;

    @property({ type: Node })
    coin_border: Node = null;
    
    @property({ type: ResultPanel })
    resultPanel: ResultPanel = null;

    @property({ type: IronController })
    iron: IronController = null;

    @property({ type: CircleListController })
    circleList: CircleListController = null;

    @property({ type: PaletteGenerator })
    paletteGenerator: PaletteGenerator = null;

    @property({ type: PixelPatternApplier })
    patternApplier: PixelPatternApplier = null;

    @property({ type: GridDrawer })
    gridDrawer: GridDrawer = null;

    @property({ type: SkillController })
    skillController: SkillController = null;

    @property({ type: Label })
    level_label: Label = null;

    @property({ type: Label })
    time_label: Label = null;

    @property({ type: UIOpacity })
    drawer_opacity: UIOpacity = null;

    @property({ type: Node })
    game_label: Node = null;

    @property({ type: Label })
    daojishi_label: Label = null;

    @property({ type: Node })
    game_item: Node = null;

    @property({ type: Node })
    start_btn: Node = null;

    @property({ type: Node })
    progress_node: Node = null;

    @property({ type: Sprite })
    progress_sp: Sprite = null;

    @property({ type: Label })
    progress_label: Label = null;

    @property({ type: Node })
    tutorial_tip: Node = null;

    @property({ type: Label })
    coin_label: Label = null;

    private currentScore: number = 0;
    private _currentLevelId: number = 1;
    private _patternPath: string = '';
    // 当前选中的颜色序号
    private _selectedColorIndex: number = 1;
    // 颜色列表 [{ r, g, b, a }]
    private _colorList: { r: number; g: number; b: number; a: number }[] = [];

    // 倒计时相关
    private _remainingTime: number = 0;  // 剩余秒数
    // 读秒倒计时相关
    private _daojiTime: number = 0;       // 读秒倒计时秒数
    private _isDaojiCounting: boolean = false; // 是否在读秒中
    private _savedDaojiCounting: boolean = false; // 暂停前是否在读秒中
    // 时间冻结相关（time_skill）
    private _isTimeFrozen: boolean = false; // 是否冻结时间
    private _timeFreezeTimer: number = 0;     // 冻结剩余时间

    // 30 秒警告相关
    private _is30SecondWarning: boolean = false; // 是否已触发 30 秒警告
    private _isFlashingRed: boolean = false;  // 是否正在红色闪烁
    private _warningTimerId: any = null;    // 闪烁定时器 ID
    private _warningSecondColor: Color = new Color(255, 255, 255, 255); // 30 秒警告闪烁的第二种颜色（默认白色）

    // palette 技能相关
    private _isPaletteActive: boolean = false; // palette 技能是否激活
    private _paletteTimer: number = 0;     // palette 技能剩余时间
    private readonly _PALETTE_DURATION: number = 10; // palette 技能持续时间（秒）

    // 进度相关
    private _totalBlockCount: number = 0;    // 有效 block 总数
    private _highlightedCount: number = 0;   // 已高亮的 block 数
    private _ironedCount: number = 0;        // 已熨烫的 block 数

    // 空闲闪烁相关（进度达到 80% 后开始检测）
    private _isIdleFlashing: boolean = false;  // 是否正在空闲闪烁
    private readonly _IDLE_FLASH_PROGRESS: number = 0.8; // 空闲提示进度阈值

    private readonly _RESULT_DELAY_SECONDS: number = 0.7;
    private _isResultDelayPending: boolean = false;
    private _resultDelayToken: number = 0;

    private _highlightIdleTimer: number = 0;
    private _ironIdleTimer: number = 0;
    private readonly _IDLE_ACTION_THRESHOLD: number = 5;
    private _idleFlashMode: 'highlight' | 'iron' | null = null;

    private _coinPrefab: Prefab | null = null;
    private _coinPreloadPromise: Promise<void> | null = null;
    private _coinLoadPromise: Promise<Prefab | null> | null = null;
    private readonly _coinNodePool: Node[] = [];
    private readonly _COIN_PREFAB_PATH: string = 'coin';
    private readonly _COIN_THROW_OFFSET_X: number = 50;
    private readonly _COIN_THROW_RISE_Y: number = 80;
    private readonly _COIN_THROW_DROP_Y: number = -30;
    private readonly _COIN_THROW_DURATION: number = 0.45;
    private readonly _COIN_STAY_MIN_DURATION: number = 0.3;
    private readonly _COIN_STAY_MAX_DURATION: number = 0.6;
    private readonly _COIN_FLY_TO_BORDER_DURATION: number = 0.3;
    private readonly _IRON_COIN_SPAWN_PROBABILITY: number = 0.1;
    private readonly _HIGHLIGHT_COIN_SPAWN_PROBABILITY: number = 0.3;
    private _levelCoinCount: number = 0;
    private _levelCoinToken: number = 0;
    private readonly _activeCoinNodes: Set<Node> = new Set();

    public tutorialController: TutorialController = null;

    get modeType(): GameModeType { return GameModeType.LEVEL; }
    public get highlightCoinSpawnProbability(): number { return this._HIGHLIGHT_COIN_SPAWN_PROBABILITY; }

    update(_deltaTime: number): void {
        const gameManager = GameManager.getInstance();

        // 读秒倒计时
        if (this._isDaojiCounting) {
            this._daojiTime -= _deltaTime;
            const sec = Math.max(0, Math.ceil(this._daojiTime));
            if (this.daojishi_label) {
                this.daojishi_label.string = sec.toString();
            }
            if (this._daojiTime <= 0) {
                this._daojiTime = 0;
                this.onDaojishiEnd();
            }
            return; // 读秒期间不处理游戏倒计时
        }

        if (gameManager.gameState != GameState.PLAYING) return;

        // palette 技能倒计时
        if (this._isPaletteActive) {
            this._paletteTimer -= _deltaTime;
            if (this._paletteTimer <= 0) {
                this._paletteTimer = 0;
                this._isPaletteActive = false;
                this.hidePalettePreview();
                // 恢复时间标签颜色
                if (this.time_label) {
                    this.time_label.color = new Color(255, 255, 255, 255);
                }
                // 更新警告闪烁颜色为白色
                this._warningSecondColor = new Color(255, 255, 255, 255);
            }
        }

        // 时间冻结期间不减少倒计时
        if (this._isTimeFrozen) {
            this._timeFreezeTimer -= _deltaTime;
            if (this._timeFreezeTimer <= 0) {
                this._isTimeFrozen = false;
                this._timeFreezeTimer = 0;
                // 恢复时间标签颜色
                if (this.time_label) {
                    this.time_label.color = new Color(255, 255, 255, 255);
                }
            }
            return;
        }

        this._remainingTime -= _deltaTime;

        // 30 秒警告：开始红色闪烁并播放 didi 音效
        if (this._remainingTime <= 30 && !this._is30SecondWarning) {
            this._is30SecondWarning = true;
            this.start30SecondWarning();
        }

        // 更新 time_label
        if (this.time_label) {
            const displaySec = Math.max(0, Math.ceil(this._remainingTime));
            const mins = Math.floor(displaySec / 60);
            const secs = displaySec % 60;
            this.time_label.string = mins > 0 ? `${mins}:${secs < 10 ? '0' + secs : secs}` : `${secs}`;
        }

        // 倒计时结束
        if (this._remainingTime <= 0) {
            this._remainingTime = 0;
            gameManager.gameState = GameState.GAME_OVER;
            this.onTimeUp();
        }

        // 空闲闪烁逻辑
        this.updateIdleFlash(_deltaTime);
    }

    start(){
        this.refreshLevelCoinLabel();
        if (this.settingBtn) {
            this.settingBtn.on(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
        if (this.start_btn) {
            this.start_btn.on(Node.EventType.TOUCH_END, this.onStartBtnClick, this);
        }
    }

    private preloadCoinPrefab(): Promise<void> {
        if (this._coinPrefab || this._coinPreloadPromise) {
            return this._coinPreloadPromise ?? Promise.resolve();
        }

        this._coinPreloadPromise = new Promise((resolve) => {
            resources.preload(this._COIN_PREFAB_PATH, Prefab, (err) => {
                this._coinPreloadPromise = null;
                if (err) {
                    console.error('预加载 coin 预制体失败:', err);
                }
                resolve();
            });
        });

        return this._coinPreloadPromise;
    }

    private async loadCoinPrefab(): Promise<Prefab | null> {
        if (this._coinPrefab) {
            return this._coinPrefab;
        }

        if (this._coinLoadPromise) {
            return this._coinLoadPromise;
        }

        this._coinLoadPromise = (async () => {
            await this.preloadCoinPrefab();

            return new Promise<Prefab | null>((resolve) => {
                resources.load(this._COIN_PREFAB_PATH, Prefab, (err, prefab) => {
                    this._coinLoadPromise = null;
                    if (err || !prefab) {
                        console.error('加载 coin 预制体失败:', err);
                        resolve(null);
                        return;
                    }

                    this._coinPrefab = prefab;
                    resolve(prefab);
                });
            });
        })();

        return this._coinLoadPromise;
    }

    private async obtainCoinNode(): Promise<Node | null> {
        while (this._coinNodePool.length > 0) {
            const cachedCoin = this._coinNodePool.pop() ?? null;
            if (!cachedCoin || !cachedCoin.isValid) {
                continue;
            }

            cachedCoin.active = true;
            cachedCoin.setScale(Vec3.ONE);
            cachedCoin.setParent(this.node);
            return cachedCoin;
        }

        const coinPrefab = await this.loadCoinPrefab();
        if (!coinPrefab || !this.node || !this.node.isValid) {
            return null;
        }

        const coin = instantiate(coinPrefab);
        coin.setParent(this.node);
        return coin;
    }

    private recycleCoinNode(coin: Node | null): void {
        if (!coin || !coin.isValid) {
            return;
        }

        this._activeCoinNodes.delete(coin);
        tween(coin).stop();
        coin.active = false;
        coin.setScale(Vec3.ONE);
        coin.setPosition(0, 0, 0);

        this._coinNodePool.push(coin);
    }

    private getCoinBorderLocalPosition(): Vec3 {
        if (!this.coin_border || !this.coin_border.isValid) {
            return new Vec3(0, 0, 0);
        }

        const rootTransform = this.node?.getComponent(UITransform);
        if (!rootTransform) {
            return new Vec3(0, 0, 0);
        }

        const borderWorldPosition = this.coin_border.getWorldPosition();
        const localPosition = rootTransform.convertToNodeSpaceAR(borderWorldPosition);
        return new Vec3(localPosition.x, localPosition.y, 0);
    }

    private refreshLevelCoinLabel(): void {
        if (this.coin_label) {
            this.coin_label.string = `${this._levelCoinCount}`;
        }
    }

    private resetLevelCoinCount(): void {
        this._levelCoinCount = 0;
        this.refreshLevelCoinLabel();
    }

    private finishLevelCoinSession(isSuccess: boolean = false): void {
        if (isSuccess && this._levelCoinCount > 0) {
            GameManager.getInstance()?.addCoins(this._levelCoinCount);
        }

        this._levelCoinToken++;
        this.resetLevelCoinCount();

        for (const coin of Array.from(this._activeCoinNodes)) {
            this.recycleCoinNode(coin);
        }
    }

    private addLevelCoin(amount: number = 1): void {
        this._levelCoinCount += amount;
        this.refreshLevelCoinLabel();
    }

    private setCoinBorderVisible(visible: boolean): void {
        if (this.coin_border) {
            this.coin_border.active = visible;
        }
    }

    public async spawnCoin(startPosition: Vec3 = new Vec3()): Promise<Node | null> {
        if (!this.node || !this.node.isValid) {
            return null;
        }

        const coin = await this.obtainCoinNode();
        if (!coin) {
            return null;
        }

        const coinToken = this._levelCoinToken;
        this._activeCoinNodes.add(coin);
        coin.setPosition(startPosition);
        coin.setScale(Vec3.ONE);

        const direction = Math.random() < 0.5 ? -1 : 1;
        const randomDistance = 20 + Math.random() * (this._COIN_THROW_OFFSET_X - 20);
        const offsetX = direction * randomDistance;
        const peakPosition = new Vec3(
            startPosition.x + offsetX * 0.5,
            startPosition.y + this._COIN_THROW_RISE_Y,
            startPosition.z,
        );
        const endPosition = new Vec3(
            startPosition.x + offsetX,
            startPosition.y + this._COIN_THROW_DROP_Y,
            startPosition.z,
        );
        const borderPosition = this.getCoinBorderLocalPosition();
        const stayDuration = this._COIN_STAY_MIN_DURATION + Math.random() * (this._COIN_STAY_MAX_DURATION - this._COIN_STAY_MIN_DURATION);

        tween(coin)
            .to(this._COIN_THROW_DURATION * 0.45, {
                position: peakPosition,
                scale: new Vec3(1.05, 1.05, 1),
            }, { easing: 'quadOut' })
            .to(this._COIN_THROW_DURATION * 0.55, {
                position: endPosition,
                scale: new Vec3(0.9, 0.9, 1),
            }, { easing: 'quadIn' })
            .delay(stayDuration)
            .to(this._COIN_FLY_TO_BORDER_DURATION, {
                position: borderPosition,
                scale: new Vec3(0.7, 0.7, 1),
            }, { easing: 'sineIn' })
            .call(() => {
                if (coinToken === this._levelCoinToken) {
                    this.addLevelCoin();
                }
                this.recycleCoinNode(coin);
            })
            .start();

        return coin;
    }
    // ==================== 30 秒警告系统 ====================

    /**
     * 开始 30 秒警告：时间文字闪烁 + didi 音效（循环播放）
     * 使用全局变量 _warningSecondColor 决定闪烁的第二种颜色
     */
    private start30SecondWarning(): void {
        if (!this.time_label) return;

        this._isFlashingRed = true;

        // 每隔 0.5 秒切换一次颜色
        const flashAndPlay = () => {
            if (!this._isFlashingRed) return;

            // 切到红色
            this.time_label.color = new Color(255, 0, 0, 255);

            // 0.5 秒后恢复
            this._warningTimerId = setTimeout(() => {
                if (!this._isFlashingRed) return;
                this.time_label.color = this._warningSecondColor;
                // 再过 0.5 秒继续下一轮闪烁（总间隔 1 秒）
                this._warningTimerId = setTimeout(() => {
                    if (this._isFlashingRed) {
                        flashAndPlay();
                    }
                }, 500);
            }, 500);
        };
        flashAndPlay();
    }

    /**
     * 停止 30 秒警告
     */
    stop30SecondWarning(): void {
        this._isFlashingRed = false;
        this._is30SecondWarning = false;

        if (this._warningTimerId) {
            clearTimeout(this._warningTimerId);
            this._warningTimerId = null;
        }
        if (this.time_label) {
            this.time_label.color = new Color(255, 255, 255, 255);
        }
    }

    // ==================== 空闲闪烁系统 ====================

    /**
     * 每帧更新空闲闪烁
     */
    private updateIdleFlash(deltaTime: number): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.gameState != GameState.PLAYING) return;

        // 计算当前进度
        const progress = (this._highlightedCount * 0.5 + this._ironedCount) / this._totalBlockCount;
        const isHighProgress = progress >= this._IDLE_FLASH_PROGRESS;

        if (!isHighProgress) {
            this._highlightIdleTimer = 0;
            this._ironIdleTimer = 0;
            if (this._isIdleFlashing) {
                this.stopIdleFlash();
            }
            return;
        }

        if (this._isIdleFlashing) {
            return;
        }

        const hasPendingIronTargets = this.hasPendingIronTargets();
        const hasPendingHighlightTargets = this.hasPendingHighlightTargets();

        this._ironIdleTimer = hasPendingIronTargets ? this._ironIdleTimer + deltaTime : 0;
        this._highlightIdleTimer = hasPendingHighlightTargets ? this._highlightIdleTimer + deltaTime : 0;

        if (hasPendingIronTargets && this._ironIdleTimer >= this._IDLE_ACTION_THRESHOLD) {
            this.startIdleFlash('iron');
            return;
        }

        if (hasPendingHighlightTargets && this._highlightIdleTimer >= this._IDLE_ACTION_THRESHOLD) {
            this.startIdleFlash('highlight');
        }

    }

    /**
     * 开始空闲闪烁（闪烁所有待提示的 block）
     */
    private startIdleFlash(mode: 'highlight' | 'iron'): void {
        this._isIdleFlashing = true;
        this._idleFlashMode = mode;
        this._highlightIdleTimer = 0;
        this._ironIdleTimer = 0;
        const blocks = this.gridDrawer.getAllBlocks();

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                // 只闪烁当前模式下需要提示的 block
                if (this.shouldFlashBlock(blockController, mode)) {
                    const redMask = block.getChildByName('red_mask');
                    if (redMask) {
                        const uiOpacity = redMask.getComponent(UIOpacity) ?? redMask.addComponent(UIOpacity);
                        // opacity 0 -> 200 -> 0，闪烁 3 次
                        tween(uiOpacity)
                            .to(0.4, { opacity: 200 })
                            .to(0.4, { opacity: 0 })
                            .union()
                            .repeat(3)
                            .call(()=>{
                                this._isIdleFlashing = false;
                                this._highlightIdleTimer = 0;
                                this._ironIdleTimer = 0;
                                this._idleFlashMode = null;
                            }).start();
                    }
                }
            }
        }
    }

    /**
     * 判断指定 block 是否需要闪烁提示
     */
    private shouldFlashBlock(blockController: BlockController | null, mode: 'highlight' | 'iron'): boolean {
        if (!blockController || blockController.targetColorA === 0) {
            return false;
        }

        if (mode === 'iron') {
            // 只要还能继续熨烫，就应该参与熨烫提示。
            return blockController.canIron();
        }

        return blockController.state === BlockState.NO_CIRCLE;
    }

    private hasPendingHighlightTargets(): boolean {
        const blocks = this.gridDrawer?.getAllBlocks();
        if (!blocks) return false;

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (this.shouldFlashBlock(blockController, 'highlight')) {
                    return true;
                }
            }
        }

        return false;
    }

    private hasPendingIronTargets(): boolean {
        const blocks = this.gridDrawer?.getAllBlocks();
        if (!blocks) return false;

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (this.shouldFlashBlock(blockController, 'iron')) {
                    return true;
                }
            }
        }

        return false;
    }

    private stopIdleFlash(): void {
        this._isIdleFlashing = false;
        this._highlightIdleTimer = 0;
        this._ironIdleTimer = 0;
        this._idleFlashMode = null;
        const blocks = this.gridDrawer.getAllBlocks();

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const redMask = block.getChildByName('red_mask');
                if (redMask) {
                    const uiOpacity = redMask.getComponent(UIOpacity);
                    if (uiOpacity) {
                        tween(uiOpacity).stop();
                        uiOpacity.opacity = 0;
                    }
                }
            }
        }
    }

    /**
     * 玩家有操作时调用，重置高亮空闲计时器并停止闪烁
     */
    public resetIdleFlashTimer(): void {
        if (this._isIdleFlashing) {
            this.stopIdleFlash();
        }
        this._highlightIdleTimer = 0;
    }

    public resetIronIdleFlashTimer(): void {
        if (this._isIdleFlashing && this._idleFlashMode === 'iron') {
            this.stopIdleFlash();
        }
        this._ironIdleTimer = 0;
    }

    // ==================== 进度系统 ====================

    /**
     * 统计有效 block 总数
     */
    public initProgress(): void {
        this._highlightedCount = 0;
        this._ironedCount = 0;
        this._highlightIdleTimer = 0;
        this._ironIdleTimer = 0;

        const blocks = this.gridDrawer?.getAllBlocks();
        if (!blocks) return;

        this._totalBlockCount = 0;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;
                const bc = block.getComponent(BlockController);
                if (!bc || bc.targetColorA === 0) continue; // 跳过透明 block
                this._totalBlockCount++;
            }
        }

        console.log(`有效 block 总数: ${this._totalBlockCount}`);
        this.updateProgressUI();
    }

    /**
     * 当 block 被高亮时调用
     * @param count 高亮的 block 数量
     */
    public onBlocksHighlighted(count: number): void {
        this._highlightedCount += count;
        this.resetIdleFlashTimer();
        this.updateProgressUI();
    }

    /**
     * 当 block 被熨烫时调用
     * @param count 熨烫的 block 数量
     */
    public onBlocksIroned(count: number, ironedBlocks: Node[] = []): void {
        this._highlightedCount -= count;
        this._ironedCount += count;
        this.resetIronIdleFlashTimer();
        this.updateProgressUI();

        for (const block of ironedBlocks) {
            this.trySpawnCoinForIronedBlock(block, this._IRON_COIN_SPAWN_PROBABILITY);
        }
    }

    public trySpawnCoinForIronedBlock(block: Node | null, probability: number): void {
        if (!block || !block.isValid || !this.node || !this.node.isValid) {
            return;
        }

        const normalizedProbability = Math.max(0, Math.min(1, probability));
        if (Math.random() >= normalizedProbability) {
            return;
        }

        const rootTransform = this.node.getComponent(UITransform);
        if (!rootTransform) {
            return;
        }

        const blockWorldPosition = block.getWorldPosition();
        const localPosition = rootTransform.convertToNodeSpaceAR(blockWorldPosition);
        void this.spawnCoin(new Vec3(localPosition.x, localPosition.y, 0));
    }

    /**
     * 更新进度 UI（progress_sp fillRange 和 progress_label 文字）
     */
    private updateProgressUI(): void {
        if (this._totalBlockCount <= 0) return;

        // 进度 = (高亮数 * 0.5 + 熨烫数 * 1) / 总数
        const progress = (this._highlightedCount * 0.5 + this._ironedCount * 1) / this._totalBlockCount;
        const percent = Math.min(100, Math.floor(progress * 100));

        // 更新 progress_sp 的 fillRange（0 到 1）
        if (this.progress_sp) {
            (this.progress_sp as any).fillRange = progress;
        }

        // 更新 progress_label 文字
        if (this.progress_label) {
            this.progress_label.string = `${percent}%`;
        }
    }

    /**
     * 重置进度到初始高亮状态（continue_btn 使用）
     * 所有格子都处于高亮状态，所以高亮数 = 总数，熨烫数 = 0
     * 进度 = (总数 * 0.5 + 0) / 总数 = 50%
     */
    public resetProgressToHighlighted(): void {
        // 统计有效 block 总数
        const blocks = this.gridDrawer?.getAllBlocks();
        if (!blocks) return;

        this._totalBlockCount = 0;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;
                const bc = block.getComponent(BlockController);
                if (!bc || bc.targetColorA === 0) continue;
                this._totalBlockCount++;
            }
        }

        // 所有格子都处于高亮状态
        this._highlightedCount = this._totalBlockCount;
        this._ironedCount = 0;
        this._highlightIdleTimer = 0;
        this._ironIdleTimer = 0;

        console.log(`进度重置为高亮状态: 总数=${this._totalBlockCount}, 高亮数=${this._highlightedCount}`);
        this.updateProgressUI();
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelId: number, patternPath: string = ''): void {
        WXManager.instance?.setCaptureRestricted();
        void this.preloadCoinPrefab();
        this.finishLevelCoinSession();
        // 显示原生模板广告
        WXManager.instance?.showNativeAd();
        // 隐藏设置按钮
        if (this.up_content) {
            this.up_content.active = false;
        }
        this.currentScore = 0;
        this._currentLevelId = levelId;
        this._patternPath = patternPath;
        // 重置时间冻结状态
        this._isTimeFrozen = false;
        this._timeFreezeTimer = 0;
        // 重置空闲闪烁状态
        this._highlightIdleTimer = 0;
        this._ironIdleTimer = 0;
        this._isIdleFlashing = false;
        this._idleFlashMode = null;
        // 重置 30 秒警告状态
        this._is30SecondWarning = false;
        this._isFlashingRed = false;
        if (this.time_label) {
            tween(this.time_label).stop();
            this.time_label.color = new Color(255, 255, 255, 255);
        }
        // 重置 palette 技能状态
        this._isPaletteActive = false;
        this._paletteTimer = 0;
        // 重置技能按钮状态
        if (this.skillController) {
            this.skillController.resetSkills();
        }
        // 隐藏 palette 预览
        if (this.gridDrawer) {
            this.gridDrawer.hideAllBlockSpritesInstant();
            this.gridDrawer.hideAllBlockCircles();
            this.gridDrawer.hideAllNumberNodes();
        }
        this.startDaojishi();
        console.log(`闯关模式: 关卡 ${levelId}, 图案: ${patternPath}`);
    }

    /**
     * 重置所有 block 到初始状态
     */
    public resetAllBlocks(): void {
        if (!this.gridDrawer) return;
        const blocks = this.gridDrawer.getAllBlocks();
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;
                const controller = block.getComponent(BlockController);
                if (controller) {
                    controller.resetBlock();
                }
            }
        }
    }

    /**
     * 开始读秒倒计时
     */
    private startDaojishi(): void {
        // 隐藏 game_label、game_item 和 progress_node
        if (this.game_label) {
            this.game_label.active = false;
        }
        if (this.game_item) {
            this.game_item.active = false;
        }
        if (this.progress_node) {
            this.progress_node.active = false;
        }

        // 显示 daojishi_label 和 start_btn
        if (this.daojishi_label) {
            this.daojishi_label.node.active = true;
        }
        if (this.start_btn) {
            this.start_btn.active = true;
        }

        // 开始读秒
        this._daojiTime = 10;
        this._isDaojiCounting = true;
        if (this.daojishi_label) {
            this.daojishi_label.string = '10';
        }

        // 立即初始化游戏倒计时，避免显示上一关残留的数值
        this.startCountdown();

        // 显示所有 block 的 sprite（显示拼豆颜色）
        if (this.gridDrawer) {
            this.gridDrawer.showAllBlockSprites();
        }

        const gameManager = GameManager.getInstance();
        if (gameManager.currentDifficulty == DifficultyMode.SIMPLE && gameManager.currentLevel === 1) {
            this.tutorial_tip.active = true;
        }

        AudioManager.instance.playGameBgm();
    }

    /**
     * 读秒结束，开始游戏
     */
    private onDaojishiEnd(): void {
        this._isDaojiCounting = false;
        this.tutorial_tip.active = false;
        // 隐藏原生模板广告
        WXManager.instance?.hideNativeAd();

        // 显示设置按钮
        if (this.up_content) {
            this.up_content.active = true;
        }

        this.setCoinBorderVisible(true);

        // 隐藏 daojishi_label 和 start_btn
        if (this.daojishi_label) {
            this.daojishi_label.node.active = false;
        }
        if (this.start_btn) {
            this.start_btn.active = false;
        }

        // 初始化进度统计
        this.initProgress();

        // 隐藏所有 block sprite（渐隐），完成后开始游戏
        if (this.gridDrawer) {
            this.gridDrawer.hideAllBlockSpritesFade(0.5, () => {
                this.startGame();
                this.startCountdown();
                // 显示 progress_node
                if (this.progress_node) {
                    this.progress_node.active = true;
                }
            });
        } else {
            this.startGame();
            this.startCountdown();
            if (this.progress_node) {
                this.progress_node.active = true;
            }
        }

        // 显示 game_label 和 game_item
        if (this.game_label) {
            this.game_label.active = true;
        }
        if (this.game_item) {
            this.game_item.active = true;
        }
    }

    /**
     * 点击 start_btn 提前结束读秒
     */
    private onStartBtnClick(): void {
        if (!this._isDaojiCounting) return;
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        gameManager?.vibrateShort();
        AudioManager.instance.playEffect('click_btn');
        this.onDaojishiEnd();
    }

    /**
     * 启动倒计时
     */
    public startCountdown(): void {
        this._remainingTime = LevelConfig.getInstance().getCurrentLevelTime();

        // 立即更新一次 label
        if (this.time_label) {
            const displaySec = Math.ceil(this._remainingTime);
            const mins = Math.floor(displaySec / 60);
            const secs = displaySec % 60;
            this.time_label.string = mins > 0 ? `${mins}:${secs < 10 ? '0' + secs : secs}` : `${secs}`;
        }
    }

    /**
     * 获取当前关卡的图案路径
     */
    get patternPath(): string {
        return this._patternPath;
    }

    get currentLevelId(): number {
        return this._currentLevelId;
    }

    public get levelCoinCount(): number {
        return this._levelCoinCount;
    }

    /**
     * 添加分数
     */
    addScore(points: number): void {
        this.currentScore += points;
        this.onScoreChange?.(this.currentScore);
        this.checkComplete();
    }

    reset(): void {
        this.currentScore = 0;
        this._isPlaying = false;
    }

    checkComplete(): boolean {
        if (!this._isPlaying) return false;

    }


    // Getters
    getCurrentScore(): number { return this.currentScore; }

    /**
     * finish_btn 点击事件 - 显示结果面板
     */
    private onFinishBtnClick(): void {
        this.endGame();

        // 检查所有可用 block 的目标颜色与当前颜色是否一致
        const isSuccess = this.checkAllBlocksColorMatch();
        this.showResultWithDelay(isSuccess);
    }

    /**
     * 倒计时结束时的处理
     */
    private onTimeUp(): void {
        this.cancelPendingResultDelay();
        this.endGame();

        // 检查是否所有可用 block 都已熨烫且颜色正确
        const allIroned = this.checkAllBlocksIroned2();
        const colorMatch = this.checkAllBlocksColorMatch();
        const isSuccess = allIroned && colorMatch;

        if (!isSuccess) AudioManager.instance.stopBgm();
        if (this.resultPanel?.node) {
            this.resultPanel.setResult(isSuccess);
            this.resultPanel.node.active = true;
        }
        this.setCoinBorderVisible(false);
        this.finishLevelCoinSession(isSuccess);
    }

    private showResultWithDelay(isSuccess: boolean): void {
        if (this._isResultDelayPending) return;

        this._isResultDelayPending = true;
        const resultDelayToken = ++this._resultDelayToken;

        this.scheduleOnce(() => {
            if (resultDelayToken !== this._resultDelayToken) return;

            this._isResultDelayPending = false;

            if (!isSuccess) AudioManager.instance.stopBgm();
            if (this.resultPanel?.node) {
                this.resultPanel.setResult(isSuccess);
                this.resultPanel.node.active = true;
            }
            this.setCoinBorderVisible(false);
            this.finishLevelCoinSession(isSuccess);
        }, this._RESULT_DELAY_SECONDS);
    }

    private cancelPendingResultDelay(): void {
        this._resultDelayToken++;
        this._isResultDelayPending = false;
    }

    /**
     * 检查是否所有可用 block 都已熨烫完成（返回 boolean）
     */
    private checkAllBlocksIroned2(): boolean {
        if (!this.gridDrawer) return false;

        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return false;

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const controller = block.getComponent(BlockController);
                if (!controller) continue;

                // 只检查可用 block
                if (controller.targetColorA <= 0) continue;

                // 只要有一个未熨烫就返回 false
                if (controller.state !== BlockState.IRONED) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 检查所有可用 block 的目标颜色与当前颜色是否完全一致
     */
    private checkAllBlocksColorMatch(): boolean {
        if (!this.gridDrawer) return false;

        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return false;

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const controller = block.getComponent(BlockController);
                if (!controller) continue;

                // 只检查可用 block（目标颜色不透明）
                if (controller.targetColorA <= 0) continue;

                // 对比 RGBA
                if (controller.targetColorR !== controller.currentColorR ||
                    controller.targetColorG !== controller.currentColorG ||
                    controller.targetColorB !== controller.currentColorB ||
                    controller.targetColorA !== controller.currentColorA) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 更新 MenuManager 的关卡按钮文字
     */
    public updateMenuLevelButton(difficulty?: DifficultyMode): void {
        const gameManager = GameManager.getInstance();
        if (gameManager.menuManager) {
            const diff = difficulty ?? gameManager.currentDifficulty;
            gameManager.menuManager.updateLevelButtonText(gameManager.currentLevel, diff);
        }
    }

    // ==================== 颜色选择 ====================

    /**
     * 获取当前选中的颜色序号
     */
    public get selectedColorIndex(): number {
        return this._selectedColorIndex;
    }

    /**
     * 设置当前选中的颜色序号
     */
    public set selectedColorIndex(value: number) {
        this._selectedColorIndex = value;
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        this.cancelPendingResultDelay();
        const gameManager = GameManager.getInstance();
        gameManager.gameState = GameState.PLAYING;
        this.selectedColorIndex = 1;

        // 记录游戏开始时间
        if (this.resultPanel) {
            this.resultPanel.recordGameStartTime();
        }

        // 显示原生格子广告（距离屏幕顶部 14% 位置）
        WXManager.instance?.showNativeGridAd(0.14);

        // 第一关开启新手引导
        if (gameManager.currentDifficulty == DifficultyMode.SIMPLE && gameManager.currentLevel === 1) {
            this.startTutorial();
        }
    }

    /**
     * 结束游戏
     */
    public endGame(): void {
        GameManager.getInstance().gameState = GameState.GAME_OVER;
    }

    /**
     * 重置游戏
     */
    public resetGame(): void {
        this.cancelPendingResultDelay();
        GameManager.getInstance().gameState = GameState.PLAYING;
        this.selectedColorIndex = 1;
    }

    // ==================== 颜色列表 ====================

    /**
     * 加载图案和调色板
     */
    public loadPatternAndPalette(patternPath: string, callback?: () => void): void {
        let completed = 0;
        const total = 2;
        const checkDone = () => {
            completed++;
            if (completed >= total && callback) {
                callback();
            }
        };

        
        if (this.patternApplier) {
            this.patternApplier.applyFromJson(patternPath, checkDone);
        } else {
            checkDone();
        }
        if (this.paletteGenerator) {
            this.paletteGenerator.loadFromJson(patternPath, checkDone);
        } else {
            checkDone();
        }
    }

    /**
     * 获取颜色列表
     */
    public getColorList(): { r: number; g: number; b: number; a: number }[] {
        return this._colorList;
    }

    /**
     * 设置颜色列表
     */
    public setColorList(colors: { r: number; g: number; b: number; a: number }[]): void {
        this._colorList = colors;
        const gameManager = GameManager.getInstance();

        // 统计每个颜色序号的 block 数量
        const colorCounts = this.gridDrawer?.countBlocksByColorNumber() ?? new Map();

        // 通知 CircleListController 更新
        if (gameManager.levelMode.circleList) {
            gameManager.levelMode.circleList.updateColorList(colors, colorCounts);
        }
    }
    
    /**
     * 检查是否所有可用 block 都已熨烫完成
     */
    public checkAllBlocksIroned(): void {
        if (!this.gridDrawer) return;

        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return;

        // 统计可用 block（目标颜色不透明）和已熨烫 block
        let totalAvailable = 0;
        let ironedCount = 0;

        // 按序号分组统计
        const indexGroups: Map<number, { total: number; ironed: number; nodes: Node[] }> = new Map();

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (!blockController) continue;

                // 检查是否是可用 block（目标颜色不透明）
                const targetA = blockController.targetColorA;
                if (targetA > 0) {
                    totalAvailable++;

                    // 获取序号
                    const numberNode = block.getChildByName('number');
                    const label = numberNode?.getComponent(Label);
                    const indexStr = label?.string ?? '';
                    const index = parseInt(indexStr) || 0;

                    if (index <= 0) continue;

                    if (!indexGroups.has(index)) {
                        indexGroups.set(index, { total: 0, ironed: 0, nodes: [] });
                    }
                    const group = indexGroups.get(index)!;
                    group.total++;
                    group.nodes.push(block);

                    // 检查是否已熨烫
                    if (blockController.state === BlockState.IRONED) {
                        ironedCount++;
                        group.ironed++;
                    }
                }
            }
        }

        // 检查每个序号组，如果全部熨烫则隐藏序号文字
        for (const group of indexGroups.values()) {
            if (group.total > 0 && group.ironed === group.total) {
                for (const block of group.nodes) {
                    const numberNode = block.getChildByName('number');
                    if (numberNode) {
                        const opacity = numberNode.getComponent(UIOpacity);
                        tween(opacity).
                            to(0.3, {opacity: 0}, { easing: 'smooth' }).
                            start();
                    }
                }
            }
        }

        // 如果所有可用 block 都已熨烫，显示 finish_btn
        if (totalAvailable > 0 && ironedCount === totalAvailable) {
            this.iron.onTouchEnd();
            this.onFinishBtnClick();
        }
    }

    /**
     * 设置按钮点击事件
     */
    private onSettingBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.setting || (gameManager.gameState == GameState.GAME_OVER)) return;
        if (gameManager.isWindowBlocking()) return;

        gameManager.vibrateShort();
        this._savedDaojiCounting = this._isDaojiCounting; // 保存读秒状态
        this._isDaojiCounting = false; // 暂停读秒倒计时
        gameManager.setting.lastState = gameManager.gameState; // 保存当前状态
        gameManager.gameState = GameState.PAUSED;
        const borderBg = gameManager.setting.border_bg;
        borderBg.getComponent(UITransform).setContentSize(600, 900);
        for (const child of borderBg.children) {
            child.getComponent(Widget)?.updateAlignment();
        }
        gameManager.setting.restart_btn.active = true;
        gameManager.setting.home_btn.active = true;
        gameManager.setting.node.active = true;
        AudioManager.instance.playEffect('setting_btn');
    }

    /**
     * 从暂停状态恢复（关闭设置面板时调用）
     */
    public resumeFromPause(): void {
        this._isDaojiCounting = this._savedDaojiCounting;
    }

    // ==================== 技能系统 ====================

    /**
     * 时间冻结技能（time_skill）
     * 停止倒计时流逝，持续 30 秒
     */
    public activateTimeFreeze(): void {
        if (this._isTimeFrozen || this._isDaojiCounting) return; // 已在冻结或读秒中
        if (this.gridDrawer) {
            this.gridDrawer.hideAllNumberNodes();
        }
        this._isTimeFrozen = true;
        this._timeFreezeTimer = 30;
        // 先停止 30 秒警告的红色闪烁
        this.stop30SecondWarning();
        // 改变时间标签颜色表示冻结状态
        if (this.time_label) {
            this.time_label.color = new Color(100, 200, 255, 255);
        }
        console.log('time_skill 激活：时间冻结30秒');
    }

    /**
     * 修复技能（fix_skill）
     * 只修复同一种颜色中不匹配数量最多的格子
     */
    public activateFixSkill(): void {
        if (!this.gridDrawer) return;

        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return;

        // 第一步：统计每种颜色的不匹配格子数量
        type ColorKey = string;
        const colorMismatchCount: Map<ColorKey, number> = new Map();
        const colorMismatchBlocks: Map<ColorKey, BlockController[]> = new Map();

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const controller = block.getComponent(BlockController);
                if (!controller) continue;

                // 只处理有 circle 的 block（HAS_CIRCLE / IRONING / IRONED 状态）
                if (controller.state !== BlockState.HAS_CIRCLE && controller.state !== BlockState.IRONING && controller.state !== BlockState.IRONED) continue;

                // 检查颜色是否与目标颜色匹配
                if (!controller.isColorMatch()) {
                    // 用 RGBA 创建唯一颜色键
                    const colorKey = `${controller.targetColorR},${controller.targetColorG},${controller.targetColorB},${controller.targetColorA}`;

                    const count = colorMismatchCount.get(colorKey) || 0;
                    colorMismatchCount.set(colorKey, count + 1);

                    const blockList = colorMismatchBlocks.get(colorKey) || [];
                    blockList.push(controller);
                    colorMismatchBlocks.set(colorKey, blockList);
                }
            }
        }

        // 第二步：找出不匹配数量最多的颜色
        let maxMismatchCount = 0;
        let targetColorKey: ColorKey = null;

        for (const [colorKey, count] of colorMismatchCount) {
            if (count > maxMismatchCount) {
                maxMismatchCount = count;
                targetColorKey = colorKey;
            }
        }

        if (!targetColorKey) {
            console.log('fix_skill 激活：没有发现颜色不匹配的 block');
            return;
        }

        // 第三步：只修复目标颜色的不匹配格子
        const targetBlocks = colorMismatchBlocks.get(targetColorKey);
        let fixedCount = 0;

        for (const controller of targetBlocks) {
            const block = controller.node;

            if (controller.state === BlockState.HAS_CIRCLE) {
                // 有 circle 状态：修复 circle 颜色
                const circleNode = block.getChildByName('circle');
                if (circleNode) {
                    const sprite = circleNode.getComponent(Sprite);
                    if (sprite) {
                        sprite.color = new Color(
                            controller.targetColorR,
                            controller.targetColorG,
                            controller.targetColorB,
                            controller.targetColorA
                        );
                        sprite.enabled = true;
                    }
                }
            } else if (controller.state === BlockState.IRONING || controller.state === BlockState.IRONED) {
                // 熨烫中 / 已熨烫状态：修复 block_sp 颜色
                const blockSpNode = block.getChildByName('block_sp');
                if (blockSpNode) {
                    const sprite = blockSpNode.getComponent(Sprite);
                    if (sprite) {
                        sprite.color = new Color(
                            controller.targetColorR,
                            controller.targetColorG,
                            controller.targetColorB,
                            controller.targetColorA
                        );
                        sprite.enabled = true;
                    }
                    const uiOpacity = blockSpNode.getComponent(UIOpacity);
                    if (uiOpacity) {
                        uiOpacity.opacity = controller.getIronOpacity255();
                    }
                }
            }
            // 更新 block 当前颜色
            controller.setCurrentColor(
                controller.targetColorR,
                controller.targetColorG,
                controller.targetColorB,
                controller.targetColorA
            );
            fixedCount++;
        }

        console.log(`fix_skill 激活：修复了 ${fixedCount} 个 "${targetColorKey}" 颜色的 block`);
    }

    /**
     * 调色板技能（palette_skill）
     * 显示所有 block 的颜色和序号文字
     * - 已熨烫且颜色正确的 block：全不透明显示
     * - 已熨烫但颜色错误 / 未熨烫的 block：半透明显示正确颜色
     */
    public activatePaletteSkill(): void {
        if (!this.gridDrawer) return;

        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return;

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const controller = block.getComponent(BlockController);
                if (!controller) continue;

                const blockSpNode = block.getChildByName('block_sp');
                if (!blockSpNode) continue;

                const sprite = blockSpNode.getComponent(Sprite);
                if (!sprite) continue;

                let uiOpacity = blockSpNode.getComponent(UIOpacity);
                if (!uiOpacity) {
                    uiOpacity = blockSpNode.addComponent(UIOpacity);
                }

                let targetOpacity = 120;
                let displayColor: Color | null = null;

                if (controller.state === BlockState.IRONED) {
                    if (controller.isColorMatch()) {
                        // 已熨烫且颜色正确：全不透明
                        targetOpacity = 255;
                    } else {
                        // 已熨烫但颜色错误：显示正确颜色，全不透明
                        displayColor = new Color(
                            controller.targetColorR,
                            controller.targetColorG,
                            controller.targetColorB,
                            controller.targetColorA
                        );
                        targetOpacity = 255;
                    }
                } else if (controller.state === BlockState.IRONING) {
                    displayColor = new Color(
                        controller.currentColorR,
                        controller.currentColorG,
                        controller.currentColorB,
                        controller.currentColorA
                    );
                    targetOpacity = controller.getIronOpacity255();
                } else if (controller.state === BlockState.HAS_CIRCLE) {
                    // 有 circle：显示目标正确颜色，半透明
                    if (controller.targetColorA > 0) {
                        displayColor = new Color(
                            controller.targetColorR,
                            controller.targetColorG,
                            controller.targetColorB,
                            controller.targetColorA
                        );
                    }
                    targetOpacity = 120;
                } else {
                    // 无 circle：显示目标颜色，半透明
                    if (controller.targetColorA > 0) {
                        displayColor = new Color(
                            controller.targetColorR,
                            controller.targetColorG,
                            controller.targetColorB,
                            controller.targetColorA
                        );
                    }
                    targetOpacity = 120;
                }

                sprite.enabled = true;
                if (displayColor) {
                    sprite.color = displayColor;
                }
                uiOpacity.opacity = targetOpacity;
            }
        }

        // 显示所有 number 节点
        this.gridDrawer.showAllNumberNodes();

        // 启动 10 秒倒计时
        this._isPaletteActive = true;
        this._paletteTimer = this._PALETTE_DURATION;

        // 改变时间标签颜色为绿色，并更新警告闪烁颜色
        if (this.time_label) {
            this.time_label.color = new Color(0, 255, 100, 255);
        }
        this._warningSecondColor = new Color(0, 255, 100, 255);

        console.log('palette_skill 激活：显示拼豆颜色预览，10秒后自动隐藏');
    }

    /**
     * 隐藏调色板预览视图（palette_skill 结束）
     */
    public hidePalettePreview(): void {
        if (!this.gridDrawer) return;
        this.gridDrawer.hideAllBlockSpritesInstant();
        this.gridDrawer.hideAllNumberNodes();
    }


    // ==================== 新手引导教程 ====================

    /**
     * 开始新手引导
     */
    public startTutorial(): void {
        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return;

        const block = blocks[12]?.[7];
        if (!block) return;

        const controller = block.getComponent(BlockController);
        if (!controller || controller.targetColorA <= 0) return;

        // 根据 block 目标颜色，找到 circleList 中对应颜色的 circle 节点
        const circleNodes = this.circleList?.colorNodes;
        let targetCircle: Node = null;

        if (circleNodes) {
            for (const node of circleNodes) {
                if (!node || !node.active) continue;
                const cc = node.getComponent(CircleController);
                if (!cc) continue;
                const color = cc.getColor();
                if (color.r === controller.targetColorR && color.g === controller.targetColorG &&
                    color.b === controller.targetColorB && color.a === controller.targetColorA) {
                    targetCircle = node;
                    break;
                }
            }
        }

        if (!targetCircle) return;

        // 加载手指预制体
        resources.load('prefab/finger', Prefab, (err, prefab) => {
            if (err || !prefab) {
                console.error('加载 finger 预制体失败:', err);
                return;
            }
            const finger = instantiate(prefab as Prefab);
            this.node.addChild(finger);
            this.tutorialController = finger.getComponent(TutorialController);
            this.tutorialController.levelMode = this;
            this.tutorialController.startTutorial(block, targetCircle, this.iron.node);
        });
    }
}



