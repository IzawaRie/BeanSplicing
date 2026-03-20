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
        // 默认隐藏游戏界面
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

        // 注册开始按钮点击事件
        if (this.start_btn) {
            this.start_btn.on(Node.EventType.TOUCH_END, this.onStartClick, this);
        }
    }

    /**
     * 开始按钮点击事件
     */
    private onStartClick(): void {
        console.log('开始游戏');
        this.switchToGame();
        this.startLevel(1);
    }

    /**
     * 切换到游戏界面
     */
    private switchToGame(): void {
        // 关闭菜单界面
        if (this.node) {
            this.node.active = false;
        }

        // 打开游戏界面
        const gameManager = GameManager.getInstance();
        if (gameManager?.levelMode?.node) {
            gameManager.levelMode.node.active = true;
        }
    }

    /**
     * 开始指定关卡
     */
    public startLevel(levelId: number): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('GameManager 未找到');
            return;
        }

        // 获取关卡数据
        const levelData = this.levelConfig?.getLevel(levelId);
        if (!levelData) {
            console.error(`关卡 ${levelId} 不存在`);
            return;
        }

        // 获取 LevelMode 并启动
        const levelMode = gameManager.levelMode;
        if (!levelMode) {
            console.error('LevelMode 组件未找到');
            return;
        }

        // 启动闯关模式
        levelMode.startLevel(levelId, levelData.patternPath);

        console.log(`开始关卡: ${levelData.name}, 图案: ${levelData.patternPath}`);
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
