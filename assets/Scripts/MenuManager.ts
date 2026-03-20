import { _decorator, Component, Node, Label } from 'cc';
import { GameManager } from './GameManager';
import { LevelConfig } from './LevelConfig';

const { ccclass, property } = _decorator;

@ccclass('MenuManager')
export class MenuManager extends Component {
    @property({ type: Node })
    start_btn: Node = null;

    private levelConfig: LevelConfig | null = null;

    /**
     * 更新关卡按钮文字
     */
    public updateLevelButtonText(level: number): void {
        if (!this.start_btn) return;

        // 查找 start_btn 下的 Label 组件
        const label = this.start_btn.children[0].getComponent(Label);
        if (label) {
            label.string = `第${level}关`;
        }
    }

    onLoad() {
        const gameManager = GameManager.getInstance();
        if (gameManager?.levelMode?.node) {
            gameManager.levelMode.node.active = false;
        }
    }

    start() {
        // 加载关卡配置
        this.levelConfig = LevelConfig.getInstance();
        this.levelConfig.loadConfig((success) => {
            if (success) {
                console.log('关卡配置加载完成');
            } else {
                console.error('关卡配置加载失败');
            }
        });

        if (this.start_btn) {
            this.start_btn.on(Node.EventType.TOUCH_END, this.onStartClick, this);
        }

        // 更新关卡按钮文字
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            this.updateLevelButtonText(gameManager.currentLevel);
        }
    }

    /**
     * 开始按钮点击事件
     */
    private onStartClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        // 获取当前关卡数
        const currentLevel = gameManager.currentLevel;
        console.log(`开始游戏 - 第${currentLevel}关`);
        this.showProgressPanel();
        this.loadLevel(currentLevel);
    }

    /**
     * 显示进度面板
     */
    private showProgressPanel(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        // 关闭菜单界面
        if (this.node) {
            this.node.active = false;
        }

        // 显示进度面板
        if (gameManager.progress?.node) {
            gameManager.progress.node.active = true;
            gameManager.progress.setProgress(0);
        }
    }

    /**
     * 加载关卡
     */
    public loadLevel(levelId: number): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('GameManager 未找到');
            return;
        }

        // 设置当前关卡数
        gameManager.currentLevel = levelId;

        const levelData = this.levelConfig?.getLevel(levelId);
        if (!levelData) {
            console.error(`关卡 ${levelId} 不存在`);
            return;
        }

        const levelMode = gameManager.levelMode;
        const gridDrawer = gameManager.gridDrawer;
        if (!levelMode || !gridDrawer) {
            console.error('LevelMode 或 GridDrawer 未找到');
            return;
        }

        // 步骤1: createGraphicsNodes -> setProgress(0.1)
        gridDrawer.createGraphicsNodes(() => {
            gameManager.progress?.setProgress(0.3, () => {
                // 步骤2: loadBlockPrefab -> setProgress(0.5)
                gridDrawer.loadBlockPrefab(() => {
                    gameManager.progress?.setProgress(0.5, () => {
                        // 步骤3: loadPatternAndPalette -> setProgress(0.9)
                        gameManager.loadPatternAndPalette(levelData.patternPath, () => {
                            gameManager.progress?.setProgress(0.8, () => {
                                // 步骤4: 启动闯关模式 -> setProgress(1)
                                levelMode.startLevel(levelId, levelData.patternPath);
                                gameManager.progress?.setProgress(1, () => {
                                    // 步骤5: 隐藏进度面板，显示游戏页面
                                    gameManager.progress.node.active = false;
                                    gameManager.levelMode.node.active = true;

                                    console.log(`开始关卡: ${levelData.name}, 图案: ${levelData.patternPath}`);
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * 返回菜单界面
     */
    public backToMenu(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        if (gameManager.levelMode?.node) {
            gameManager.levelMode.node.active = false;
        }
        if (this.node) {
            this.node.active = true;
        }
    }

    onDestroy() {
        if (this.start_btn) {
            this.start_btn.off(Node.EventType.TOUCH_END, this.onStartClick, this);
        }
    }
}
