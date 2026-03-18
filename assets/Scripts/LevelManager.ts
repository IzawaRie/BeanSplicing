import { _decorator, Component, Node } from 'cc';
import { LevelConfig, LevelData, GridConfig } from './LevelConfig';
import { GridDrawer } from './GridDrawer';
const { ccclass, property } = _decorator;

/**
 * 关卡管理器
 * 负责关卡的加载、切换和游戏流程控制
 */
@ccclass('LevelManager')
export class LevelManager extends Component {
    @property({ type: GridDrawer })
    gridDrawer: GridDrawer | null = null;

    private levelConfig: LevelConfig | null = null;
    private currentLevelData: LevelData | null = null;
    private currentScore: number = 0;
    private currentMoves: number = 0;
    private isLevelActive: boolean = false;

    onLoad() {
        this.levelConfig = LevelConfig.getInstance();
    }

    start() {
        this.loadLevelConfig();
    }

    /**
     * 加载关卡配置文件
     */
    private loadLevelConfig(): void {
        this.levelConfig?.loadConfig((success) => {
            if (success) {
                console.log('关卡配置加载完成');
                // 可以在这里开始第一关
                this.startLevel(1);
            } else {
                console.error('关卡配置加载失败');
            }
        });
    }

    /**
     * 开始指定关卡
     * @param levelId 关卡ID
     */
    public startLevel(levelId: number): void {
        const levelData = this.levelConfig?.getLevel(levelId);
        if (!levelData) {
            console.error(`关卡 ${levelId} 不存在`);
            return;
        }

        this.currentLevelData = levelData;
        this.currentScore = 0;
        this.currentMoves = levelData.moves;
        this.isLevelActive = true;

        // 配置网格
        this.setupGrid(levelData.grid);

        console.log(`开始关卡: ${levelData.name}`);
        console.log(`目标分数: ${levelData.target.value}`);
        console.log(`可用步数: ${levelData.moves}`);
    }

    /**
     * 设置网格参数
     */
    private setupGrid(gridConfig: GridConfig): void {
        if (this.gridDrawer) {
            this.gridDrawer.updateGrid(gridConfig.rows, gridConfig.columns);
        }
    }

    /**
     * 执行一步操作
     * @returns 是否成功执行
     */
    public makeMove(): boolean {
        if (!this.isLevelActive || this.currentMoves <= 0) {
            return false;
        }

        this.currentMoves--;
        console.log(`剩余步数: ${this.currentMoves}`);

        // 检查是否耗尽步数
        if (this.currentMoves <= 0) {
            this.checkLevelEnd();
        }

        return true;
    }

    /**
     * 添加分数
     */
    public addScore(points: number): void {
        this.currentScore += points;
        console.log(`当前分数: ${this.currentScore}`);

        // 检查是否达成目标
        if (this.currentLevelData?.target.type === 'score') {
            if (this.currentScore >= this.currentLevelData.target.value) {
                this.levelComplete();
            }
        }
    }

    /**
     * 检查关卡是否结束
     */
    private checkLevelEnd(): void {
        if (!this.currentLevelData) return;

        if (this.currentLevelData.target.type === 'score') {
            if (this.currentScore >= this.currentLevelData.target.value) {
                this.levelComplete();
            } else {
                this.levelFailed();
            }
        }
    }

    /**
     * 关卡完成
     */
    private levelComplete(): void {
        this.isLevelActive = false;
        console.log('关卡完成!');

        // 可以触发 UI 显示、通关动画等
        this.onLevelComplete?.();
    }

    /**
     * 关卡失败
     */
    private levelFailed(): void {
        this.isLevelActive = false;
        console.log('关卡失败!');

        // 可以触发 UI 显示、重新开始提示等
        this.onLevelFailed?.();
    }

    /**
     * 进入下一关
     */
    public goToNextLevel(): boolean {
        if (this.levelConfig?.nextLevel()) {
            const nextLevel = this.levelConfig.getNextLevel();
            if (nextLevel) {
                this.startLevel(nextLevel.id);
                return true;
            }
        }
        return false;
    }

    /**
     * 重新开始当前关卡
     */
    public restartLevel(): void {
        if (this.currentLevelData) {
            this.startLevel(this.currentLevelData.id);
        }
    }

    // 回调函数（可由外部赋值）
    public onLevelComplete?: () => void;
    public onLevelFailed?: () => void;

    // ==================== Getter ====================

    public getCurrentScore(): number {
        return this.currentScore;
    }

    public getRemainingMoves(): number {
        return this.currentMoves;
    }

    public getCurrentLevelData(): LevelData | null {
        return this.currentLevelData;
    }

    public isActive(): boolean {
        return this.isLevelActive;
    }

    public getTargetScore(): number {
        return this.currentLevelData?.target.value || 0;
    }
}
