import { _decorator, Component, Node } from 'cc';
import { GameManager } from './GameManager';
import { LevelConfig } from './LevelConfig';

const { ccclass, property } = _decorator;

@ccclass('MenuManager')
export class MenuManager extends Component {
    @property({ type: Node })
    start_btn: Node = null;

    private levelConfig: LevelConfig | null = null;

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
    }

    /**
     * 开始按钮点击事件
     */
    private onStartClick(): void {
        console.log('开始游戏');
        this.showProgressPanel();
        this.loadLevel(1);
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
    private loadLevel(levelId: number): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('GameManager 未找到');
            return;
        }

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

        // 设置进度 20%
        gameManager.progress?.setProgress(0.2);

        // 手动调用 GridDrawer 创建 graphics
        gridDrawer.createGraphicsNodes();

        // 设置进度 30%
        gameManager.progress?.setProgress(0.3);

        // 手动调用 loadBlockPrefab 创建 blocks
        gridDrawer.loadBlockPrefab();

        // 设置进度 50%
        gameManager.progress?.setProgress(0.5);

        // 加载图案和调色板，完成后设置进度90%
        gameManager.loadPatternAndPalette(levelData.patternPath, () => {
            console.log('loadPatternAndPalette');
            gameManager.progress?.setProgress(0.9);

            // 启动闯关模式
            levelMode.startLevel(levelId, levelData.patternPath);

            // 设置进度 100%
            gameManager.progress?.setProgress(1);

            // 隐藏进度面板打开游戏页面
            gameManager.progress.node.active = false;
            gameManager.levelMode.node.active = true;
            
            console.log(`开始关卡: ${levelData.name}, 图案: ${levelData.patternPath}`);
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
