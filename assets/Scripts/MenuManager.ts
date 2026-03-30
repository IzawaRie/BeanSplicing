import { _decorator, Component, Node, Label, resources, Prefab, instantiate, UITransform, tween, Tween, Vec3, UIOpacity, random, Sprite, Color } from 'cc';
import { GameManager, GameState } from './GameManager';
import { LevelConfig } from './LevelConfig';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('MenuManager')
export class MenuManager extends Component {
    @property({ type: Node })
    bg: Node = null;

    @property({ type: Node })
    start_btn: Node = null;

    @property({ type: Node })
    setting_btn: Node = null;

    private levelConfig: LevelConfig | null = null;
    private starPrefab: Prefab = null;
    private spawnedStars: Node[] = [];
    private spawnInterval: number = 12;  // 每秒刷新
    private maxStars: number = 10;  // 最多星星数量
    private minStarSpacing: number = 150;  // 星星最小间隔
    private btn_color1: Color = new Color(255, 230, 166);
    private btn_color2: Color = new Color(255, 183, 197);
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
            if (num === 10) {
                return '十';
            }
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

        // 加载星星预制体
        resources.load('prefab/star_light', Prefab, (err, prefab) => {
            if (err) {
                console.error('加载 star_light 预制体失败:', err);
                return;
            }
            this.starPrefab = prefab as Prefab;
            // 初始化星星并显示
            this.initStars();
            this.showRandomStars();
            console.log('star_light 预制体加载成功');
        });
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

        if (this.setting_btn) {
            this.setting_btn.on(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
    }

    /**
     * 初始化星星
     */
    private initStars(): void {
        if (!this.starPrefab || !this.bg) return;

        // 如果星星不足，先创建
        while (this.spawnedStars.length < this.maxStars) {
            const star = instantiate(this.starPrefab);
            this.bg.addChild(star);
            this.spawnedStars.push(star);
        }
    }

    /**
     * 显示指定数量的星星并播放闪烁
     */
    private showRandomStars(): void {
        if (!this.starPrefab || !this.bg) return;

        // 显示指定数量的星星
        for (let i = 0; i < this.maxStars; i++) {
            const star = this.spawnedStars[i];
            this.setStarPosition(star);

            // 播放一次闪烁动画（完成后自动刷新位置）
            this.scheduleOnce(()=>{
                this.playTwinkle(star);
            }, Math.random() * 5);
        }
    }

    /**
     * 星星闪烁动画
     */
    private playTwinkle(star: Node): void {
        const sprite = star.getComponent(Sprite);
        const random = Math.random();
        sprite.color = random < 0.5 ? this.btn_color1 : this.btn_color2;
        const opacityComp = star.getComponent(UIOpacity);

        // 随机缩放范围
        const minScale = 0;
        const maxScale = 1.0 + Math.random() * 0.5;
        // 随机透明度范围（配合缩放）
        const minOpacity = 0;
        const maxOpacity = 255;
        const duration = (this.spawnInterval / 3) + (Math.random() * 2 - 1);

        opacityComp.opacity = maxOpacity;

        // 缩放和透明度循环闪烁，动画完成后刷新位置
        tween(star)
            .to(duration, { scale: new Vec3(minScale, minScale, 1) }, { easing: 'sineInOut' })
            .to(duration, { scale: new Vec3(maxScale, maxScale, 1) }, { easing: 'sineInOut' })
            .to(duration, { scale: new Vec3(minScale, minScale, 1) }, { easing: 'sineInOut' })
            .call(() => {
                this.scheduleOnce(()=>{
                    this.setStarPosition(star);
                    this.playTwinkle(star);
                }, Math.random() * 3);  // 继续循环
            })
            .start();

        tween(opacityComp)
            .to(duration, { opacity: minOpacity }, { easing: 'sineInOut' })
            .to(duration, { opacity: maxOpacity }, { easing: 'sineInOut' })
            .to(duration, { opacity: minOpacity }, { easing: 'sineInOut' })
            .start();
    }

    /**
     * 为星星设置随机位置
     */
    private setStarPosition(star: Node): void {
        if (!this.bg) return;

        const bgTransform = this.bg.getComponent(UITransform);
        if (!bgTransform) return;

        let posX: number, posY: number;
        let attempts = 0;
        const maxAttempts = 20;

        // 尝试找到不与已显示星星重叠的位置
        do {
            posX = (Math.random() - 0.5) * bgTransform.width * 0.9;
            posY = (Math.random() - 0.5) * bgTransform.height * 0.9;
            attempts++;
        } while (attempts < maxAttempts && this.isTooCloseToActiveStars(posX, posY, star));

        star.setPosition(posX, posY, 0);
    }

    /**
     * 检查位置是否与活动的星星太近（排除指定星星）
     */
    private isTooCloseToActiveStars(x: number, y: number, exclude: Node): boolean {
        for (const star of this.spawnedStars) {
            if (!star.active || star === exclude) continue;
            const dx = star.position.x - x;
            const dy = star.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.minStarSpacing) {
                return true;
            }
        }
        return false;
    }

    /**
     * 开始按钮点击事件
     */
    private onStartClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager || (gameManager.gameState != GameState.WAITING)) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');
        AudioManager.instance.stopBgm();

        // 获取当前关卡数
        const currentLevel = gameManager.currentLevel;
        console.log(`开始游戏 - 第${this.toChineseNum(currentLevel)}关`);
        this.showProgressPanel();
        this.loadLevel(currentLevel);
    }

    /**
     * 设置按钮点击事件
     */
    private onSettingBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.setting || (gameManager.gameState != GameState.WAITING)) return;

        gameManager.vibrateShort();
        gameManager.gameState = GameState.PAUSED;
        gameManager.setting.lastState = GameState.WAITING;
        gameManager.setting.node.active = true;
        AudioManager.instance.playEffect('setting_btn');
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

        // 开启原始画布
        const drawerOpacity = gameManager.levelMode.drawer_opacity;
        drawerOpacity.opacity = 255;

        // 步骤1: createGraphicsNodes -> setProgress(0.1)
        gridDrawer.createGraphicsNodes(() => {
            gameManager.progress?.setProgress(0.3, () => {
                // 步骤2: loadBlockPrefab (只创建有效 block) -> setProgress(0.5)
                gridDrawer.loadBlockPrefab(levelData.patternPath, () => {
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
        if (this.setting_btn) {
            this.setting_btn.off(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
    }
}
