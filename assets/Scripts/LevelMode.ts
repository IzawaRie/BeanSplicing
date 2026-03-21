import { _decorator, Component, Label, Node } from 'cc';
import { GameMode, GameModeType, GameResult } from './GameMode';
import { GridDrawer } from './GridDrawer';
import { IronController } from './IronController';
import { CircleListController } from './CircleListController';
import { PaletteGenerator } from './PaletteGenerator';
import { PixelPatternApplier } from './PixelPatternApplier';
import { GameManager } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { ResultPanel } from './ResultPanel';
import { LevelConfig } from './LevelConfig';

const { ccclass, property } = _decorator;

/**
 * 闯关模式
 * 按顺序通关，有步数限制和目标分数
 */
@ccclass('LevelMode')
export class LevelMode extends GameMode {
    static readonly MODE_TYPE = GameModeType.LEVEL;

    @property({ type: Node })
    restartBtn: Node = null;

    @property({ type: Node })
    finish_btn: Node = null;
    
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

    @property({ type: Label })
    level_label: Label = null;

    @property({ type: Label })
    time_label: Label = null;

    // 游戏状态
    private _isGameActive: boolean = false;
    private currentScore: number = 0;
    private _patternPath: string = '';
    // 当前选中的颜色序号
    private _selectedColorIndex: number = 1;
    // 颜色列表 [{ r, g, b, a }]
    private _colorList: { r: number; g: number; b: number; a: number }[] = [];

    // 倒计时相关
    private _remainingTime: number = 0;  // 剩余秒数
    private _isCountingDown: boolean = false;  // 是否正在倒计时

    get modeType(): GameModeType { return GameModeType.LEVEL; }

    update(_deltaTime: number): void {
        if (!this._isCountingDown) return;

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
            this._isCountingDown = false;
            this.onTimeUp();
        }
    }

    start(){
        // 默认隐藏 finish_btn
        if (this.finish_btn) {
            this.finish_btn.active = false;
            // 注册完成按钮点击事件
            this.finish_btn.on(Node.EventType.TOUCH_END, this.onFinishBtnClick, this);
        }
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelId: number, patternPath: string = ''): void {
        this.currentScore = 0;
        this._patternPath = patternPath;
        this.startGame();
        this.startCountdown();
        console.log(`闯关模式: 关卡 ${levelId}, 图案: ${patternPath}`);
    }

    /**
     * 启动倒计时
     */
    private startCountdown(): void {
        this._remainingTime = LevelConfig.getInstance().getCurrentLevelTime();
        this._isCountingDown = true;

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
        this._isCountingDown = false;
        this._isGameActive = false;

        if (this.finish_btn) {
            this.finish_btn.active = false;
        }

        // 检查所有可用 block 的目标颜色与当前颜色是否一致
        const isSuccess = this.checkAllBlocksColorMatch();

        if (this.resultPanel?.node) {
            this.resultPanel.setResult(isSuccess);
            this.resultPanel.node.active = true;
        }
    }

    /**
     * 倒计时结束时的处理
     */
    private onTimeUp(): void {
        // 停止游戏
        this._isGameActive = false;

        // 隐藏 finish_btn
        if (this.finish_btn) {
            this.finish_btn.active = false;
        }

        // 检查是否所有可用 block 都已熨烫且颜色正确
        const allIroned = this.checkAllBlocksIroned2();
        const colorMatch = this.checkAllBlocksColorMatch();
        const isSuccess = allIroned && colorMatch;

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
    public updateMenuLevelButton(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager.menuManager) {
            gameManager.menuManager.updateLevelButtonText(gameManager.currentLevel);
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
        this._isGameActive = true;
        this.selectedColorIndex = 1;
    }

    /**
     * 结束游戏
     */
    public endGame(): void {
        this._isGameActive = false;
    }

    /**
     * 重置游戏
     */
    public resetGame(): void {
        this._isGameActive = false;
        this.selectedColorIndex = 1;
    }

    // ==================== 游戏状态 ====================

    /**
     * 游戏是否进行中
     */
    public get isGameActive(): boolean {
        return this._isGameActive;
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
        // 通知 CircleListController 更新
        if (gameManager.levelMode.circleList) {
            gameManager.levelMode.circleList.updateColorList(colors);
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
                    // 检查是否已熨烫
                    if (blockController.state === BlockState.IRONED) {
                        ironedCount++;
                    }
                }
            }
        }

        // 如果所有可用 block 都已熨烫，显示 finish_btn
        if (this.finish_btn && totalAvailable > 0 && ironedCount === totalAvailable) {
            this.finish_btn.active = true;
        }
    }
}
