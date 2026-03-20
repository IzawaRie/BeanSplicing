import { _decorator, Component, Node } from 'cc';
import { GridDrawer } from './GridDrawer';
import { PixelPatternApplier } from './PixelPatternApplier';
import { PaletteGenerator } from './PaletteGenerator';
import { CircleListController } from './CircleListController';
import { IronController } from './IronController';
import { BlockController, BlockState } from './BlockController';
import { GameMode, GameModeType} from './GameMode';
import { LevelMode } from './LevelMode';
import { MenuManager } from './MenuManager';
import { ProgressController } from './ProgressController';
const { ccclass, property } = _decorator;

/**
 * 游戏管理器
 * 负责游戏全局状态管理和多模式支持
 */
@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    @property({ type: GridDrawer })
    gridDrawer: GridDrawer = null;

    @property({ type: MenuManager })
    menuManager: MenuManager = null;

    @property({ type: ProgressController })
    progress: ProgressController = null;

    // 闯关模式组件
    @property({ type: LevelMode })
    levelMode: LevelMode = null;

    // 当前游戏模式
    private currentMode: GameMode = null;
    private _currentModeType: GameModeType = GameModeType.LEVEL;

    // 当前选中的颜色序号
    private _selectedColorIndex: number = 1;

    // 游戏状态
    private _isGameActive: boolean = false;

    // 颜色列表 [{ r, g, b, a }]
    private _colorList: { r: number; g: number; b: number; a: number }[] = [];

    // 当前关卡数
    private _currentLevel: number = 1;

    public hand_setting = 1; //-1:左手  1:右手

    onLoad() {
        // 单例模式
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;
    }

    start() {
        // 默认隐藏 finish_btn
        if (this.levelMode.finish_btn) {
            this.levelMode.finish_btn.active = false;
            // 注册完成按钮点击事件
            this.levelMode.finish_btn.on(Node.EventType.TOUCH_END, this.onFinishBtnClick, this);
        }

        this.levelMode.patternApplier.gridDrawer = this.gridDrawer;
        this.levelMode.circleList.setAllNodes();
    }

    /**
     * 完成按钮点击事件 - 进入下一关
     */
    private onFinishBtnClick(): void {
        // 进入下一关
        this.nextLevel();

        // 重新加载关卡
        if (this.menuManager) {
            this.menuManager.loadLevel(this._currentLevel);
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
        if (this.levelMode.finish_btn && totalAvailable > 0 && ironedCount === totalAvailable) {
            this.levelMode.finish_btn.active = true;
        }
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): GameManager | null {
        return GameManager._instance;
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

    // ==================== 游戏状态 ====================

    /**
     * 游戏是否进行中
     */
    public get isGameActive(): boolean {
        return this._isGameActive;
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        this._isGameActive = true;
        this._selectedColorIndex = 1;
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
        this._selectedColorIndex = 1;
    }

    // ==================== 当前关卡 ====================

    /**
     * 获取当前关卡数
     */
    public get currentLevel(): number {
        return this._currentLevel;
    }

    /**
     * 设置当前关卡数
     */
    public set currentLevel(value: number) {
        this._currentLevel = value;
        // 通知 MenuManager 更新按钮文字
        this.updateMenuLevelButton();
    }

    /**
     * 进入下一关
     */
    public nextLevel(): void {
        this._currentLevel++;
        this.updateMenuLevelButton();
    }

    /**
     * 更新 MenuManager 的关卡按钮文字
     */
    private updateMenuLevelButton(): void {
        if (this.menuManager) {
            this.menuManager.updateLevelButtonText(this._currentLevel);
        }
    }

    // ==================== 颜色列表 ====================

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
        // 通知 CircleListController 更新
        if (this.levelMode.circleList) {
            this.levelMode.circleList.updateColorList(colors);
        }
    }

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

        if (this.levelMode.patternApplier) {
            this.levelMode.patternApplier.applyFromJson(patternPath, checkDone);
        } else {
            checkDone();
        }
        if (this.levelMode.paletteGenerator) {
            this.levelMode.paletteGenerator.loadFromJson(patternPath, checkDone);
        } else {
            checkDone();
        }
    }

    // ==================== 游戏模式 ====================

    /**
     * 获取当前模式类型
     */
    public get currentModeType(): GameModeType {
        return this._currentModeType;
    }

    /**
     * 切换游戏模式
     */
    public switchMode(modeType: GameModeType): void {
        this._currentModeType = modeType;

        switch (modeType) {
            case GameModeType.LEVEL:
                this.currentMode = this.levelMode;
                if (this.currentMode) {
                    this.currentMode.setGridDrawer(this.gridDrawer);
                }
                break;
        }

        console.log(`切换到游戏模式: ${modeType}`);
    }

    /**
     * 获取当前模式
     */
    public getCurrentMode(): GameMode | null {
        return this.currentMode;
    }

    /**
     * 开始闯关模式
     */
    public startLevelMode(levelId: number): void {
        this.switchMode(GameModeType.LEVEL);
        if (this.levelMode) {
            this.levelMode.startLevel(levelId);
            this.startGame();
        }
    }
}
