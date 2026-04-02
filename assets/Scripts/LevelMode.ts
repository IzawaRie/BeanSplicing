import { _decorator, Component, Label, Node, Sprite, tween, UIOpacity, Color } from 'cc';
import { GameMode, GameModeType} from './GameMode';
import { GridDrawer } from './GridDrawer';
import { IronController } from './IronController';
import { CircleListController } from './CircleListController';
import { PaletteGenerator } from './PaletteGenerator';
import { PixelPatternApplier } from './PixelPatternApplier';
import { GameManager, GameState, DifficultyMode } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { ResultPanel } from './ResultPanel';
import { LevelConfig } from './LevelConfig';
import { AudioManager } from './AudioManager';
import { SkillController } from './SkillController';

const { ccclass, property } = _decorator;

/**
 * 闯关模式
 * 按顺序通关，有步数限制和目标分数
 */
@ccclass('LevelMode')
export class LevelMode extends GameMode {
    static readonly MODE_TYPE = GameModeType.LEVEL;

    @property({ type: Node })
    settingBtn: Node = null;
    
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

    private currentScore: number = 0;
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

    // 进度相关
    private _totalBlockCount: number = 0;    // 有效 block 总数
    private _highlightedCount: number = 0;   // 已高亮的 block 数
    private _ironedCount: number = 0;        // 已熨烫的 block 数

    get modeType(): GameModeType { return GameModeType.LEVEL; }

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
    }

    start(){
        if (this.settingBtn) {
            this.settingBtn.on(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
        if (this.start_btn) {
            this.start_btn.on(Node.EventType.TOUCH_END, this.onStartBtnClick, this);
        }
    }

    // ==================== 进度系统 ====================

    /**
     * 统计有效 block 总数
     */
    public initProgress(): void {
        this._highlightedCount = 0;
        this._ironedCount = 0;

        const blocks = this.gridDrawer?.getAllBlocks();
        if (!blocks) return;

        this._totalBlockCount = 0;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;
                const bc = block.getComponent(BlockController);
                if (!bc || bc.targetColorA === 0) continue; // 跳过透明
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
        this.updateProgressUI();
    }

    /**
     * 当 block 被熨烫时调用
     * @param count 熨烫的 block 数量
     */
    public onBlocksIroned(count: number): void {
        this._highlightedCount -= count;
        this._ironedCount += count;
        this.updateProgressUI();
    }

    /**
     * 更新进度 UI（progress_sp fillRange 和 progress_label 文字）
     */
    private updateProgressUI(): void {
        if (this._totalBlockCount <= 0) return;

        // 进度 = (高亮数 * 0.5 + 熨烫数 * 1) / 总数 * 100
        const progress = (this._highlightedCount * 0.5 + this._ironedCount * 1) / this._totalBlockCount;
        const percent = Math.min(100, Math.floor(progress * 100));

        // 更新 progress_sp fillRange（0 到 1）
        if (this.progress_sp) {
            (this.progress_sp as any).fillRange = progress;
        }

        // 更新 progress_label 文字
        if (this.progress_label) {
            this.progress_label.string = `${percent}%`;
        }
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelId: number, patternPath: string = ''): void {
        this.currentScore = 0;
        this._patternPath = patternPath;
        // 重置时间冻结状态
        this._isTimeFrozen = false;
        this._timeFreezeTimer = 0;
        if (this.time_label) {
            tween(this.time_label).stop();
            this.time_label.color = new Color(255, 255, 255, 255);
        }
        // 重置技能按钮状态
        if (this.skillController) {
            this.skillController.resetSkills();
        }
        // 隐藏 palette 预览
        if (this.gridDrawer) {
            this.gridDrawer.hideAllBlockSpritesInstant();
            this.gridDrawer.hideAllNumberNodes();
        }
        this.startDaojishi();
        console.log(`闯关模式: 关卡 ${levelId}, 图案: ${patternPath}`);
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

        // 立即初始化游戏倒计时，避免显示上一关的残留数值
        this.startCountdown();

        // 显示所有 block 的 sprite（显示拼豆颜色）
        if (this.gridDrawer) {
            this.gridDrawer.showAllBlockSprites();
        }

        AudioManager.instance.playGameBgm();
    }

    /**
     * 读秒结束，开始游戏
     */
    private onDaojishiEnd(): void {
        this._isDaojiCounting = false;

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
    private startCountdown(): void {
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
        if(!isSuccess) AudioManager.instance.stopGameBgm();
        if (this.resultPanel?.node) {
            this.resultPanel.setResult(isSuccess);
            this.resultPanel.node.active = true;
        }
    }

    /**
     * 倒计时结束时的处理
     */
    private onTimeUp(): void {
        this.endGame();

        // 检查是否所有可用 block 都已熨烫且颜色正确
        const allIroned = this.checkAllBlocksIroned2();
        const colorMatch = this.checkAllBlocksColorMatch();
        const isSuccess = allIroned && colorMatch;

        if(!isSuccess) AudioManager.instance.stopGameBgm();
        if (this.resultPanel?.node) {
            this.resultPanel.setResult(isSuccess);
            this.resultPanel.node.active = true;
        }
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
        GameManager.getInstance().gameState = GameState.PLAYING;
        this.selectedColorIndex = 1;
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
     * 停止倒计时时间，持续10秒
     */
    public activateTimeFreeze(): void {
        if (this._isTimeFrozen || this._isDaojiCounting) return; // 已在冻结或读秒中
        if (this.gridDrawer) {
            this.gridDrawer.hideAllNumberNodes();
        }
        this._isTimeFrozen = true;
        this._timeFreezeTimer = 30;
        // 改变时间标签颜色表示冻结状态
        if (this.time_label) {
            this.time_label.color = new Color(100, 200, 255, 255);
        }
        console.log('time_skill 激活：时间冻结30秒');
    }

    /**
     * 修复技能（fix_skill）
     * 修复所有颜色不匹配的 block，将其颜色改为正确的目标颜色
     */
    public activateFixSkill(): void {
        if (!this.gridDrawer) return;

        const blocks = this.gridDrawer.getAllBlocks();
        if (!blocks) return;

        let fixedCount = 0;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const controller = block.getComponent(BlockController);
                if (!controller) continue;

                // 只处理有 circle 的 block（HAS_CIRCLE 或 IRONED 状态）
                if (controller.state !== BlockState.HAS_CIRCLE && controller.state !== BlockState.IRONED) continue;

                // 检查颜色是否与目标颜色匹配
                if (!controller.isColorMatch()) {
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
                    } else if (controller.state === BlockState.IRONED) {
                        // 已熨烫状态：修复 block_sp 颜色
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
                            // 恢复 opacity 为全不透明
                            const uiOpacity = blockSpNode.getComponent(UIOpacity);
                            if (uiOpacity) {
                                uiOpacity.opacity = 255;
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
            }
        }

        console.log(`fix_skill 激活：修复了 ${fixedCount} 个错误的 block`);
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
        console.log('palette_skill 激活：显示拼豆颜色预览');
    }

    /**
     * 隐藏调色板预览视图（palette_skill 结束）
     */
    public hidePalettePreview(): void {
        if (!this.gridDrawer) return;
        this.gridDrawer.hideAllBlockSpritesInstant();
        this.gridDrawer.hideAllNumberNodes();
    }
}
