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
     * 数字转中文
     */
    private toChineseNum(num: number): string {
        if (num <= 0) return String(num);

        const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

        // 处理个位
        if (num < 10) {
            return digits[num];
        }

        // 处理 10-19
        if (num < 20) {
            return `十${digits[num - 10]}`;
        }

        // 处理 20-99
        if (num < 100) {
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            if (ones === 0) {
                return `${digits[tens]}十`;
            }
            return `${digits[tens]}十${digits[ones]}`;
        }

        // 处理 100-999
        if (num < 1000) {
            const hundreds = Math.floor(num / 100);
            const remainder = num % 100;
            const hundredsStr = `${digits[hundreds]}百`;
            if (remainder === 0) {
                return hundredsStr;
            }
            if (remainder < 10) {
                return `${hundredsStr}零${digits[remainder]}`;
            }
            return `${hundredsStr}${this.toChineseNum(remainder)}`;
        }

        // 处理 1000-9999
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        const thousandsStr = `${digits[thousands]}千`;
        if (remainder === 0) {
            return thousandsStr;
        }
        if (remainder < 100) {
            return `${thousandsStr}零${this.toChineseNum(remainder)}`;
        }
        return `${thousandsStr}${this.toChineseNum(remainder)}`;
    }

    /**
     * 更新关卡按钮文字
     */
    public updateLevelButtonText(level: number): void {
        if (!this.start_btn) return;

        // 查找 start_btn 下的 Label 组件
        const label = this.start_btn.children[0].getComponent(Label);
        if (label) {
            label.string = `第${this.toChineseNum(level)}关`;
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
        console.log(`开始游戏 - 第${this.toChineseNum(currentLevel)}关`);
        this.showProgressPanel();
        this.loadLevel(currentLevel);
    }

    /**
     * 显示进度面板
     */
    public showProgressPanel(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        // 关闭菜单界面
        if (this.node) {
            this.node.active = false;
        }

        // 显示进度面板
        if (gameManager.progress?.node) {
            gameManager.progress.node.active = true;
            gameManager.progress.setProgressImmediate(0);
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
        const gridDrawer = levelMode?.gridDrawer;
        if (!levelMode || !gridDrawer) {
            console.error('LevelMode 或 GridDrawer 未找到');
            return;
        }

        // 隐藏 finish_btn
        if (levelMode.finish_btn) {
            levelMode.finish_btn.active = false;
        }

        // 步骤1: createGraphicsNodes -> setProgress(0.1)
        gridDrawer.createGraphicsNodes(() => {
            gameManager.progress?.setProgress(0.3, () => {
                // 步骤2: loadBlockPrefab -> setProgress(0.5)
                gridDrawer.loadBlockPrefab(() => {
                    gameManager.progress?.setProgress(0.5, () => {
                        // 步骤3: loadPatternAndPalette -> setProgress(0.9)
                        gameManager.levelMode.loadPatternAndPalette(levelData.patternPath, () => {
                            gameManager.progress?.setProgress(0.8, () => {
                                // 步骤4: 启动闯关模式 -> setProgress(1)
                                levelMode.startLevel(levelId, levelData.patternPath);
                                gameManager.progress?.setProgress(1, () => {
                                    // 步骤5: 隐藏进度面板，显示游戏页面
                                    gameManager.progress.node.active = false;
                                    gameManager.levelMode.node.active = true;
                                    gameManager.levelMode.level_label.string = `第${this.toChineseNum(gameManager.currentLevel)}关`;
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
