import { _decorator, Component, Node, Label, resources, Prefab, instantiate, UITransform, tween, Tween, Vec3, UIOpacity, random, Sprite, Color, Widget, view } from 'cc';
import { GameManager, GameState, DifficultyMode } from './GameManager';
import { LevelConfig } from './LevelConfig';
import { AudioManager } from './AudioManager';
import { WXManager } from './WXManager';

const { ccclass, property } = _decorator;

@ccclass('MenuManager')
export class MenuManager extends Component {
    @property({ type: Node })
    bg: Node = null;

    @property({ type: Node })
    simple_btn: Node = null;

    @property({ type: Node })
    medium_btn: Node = null;

    @property({ type: Node })
    hard_btn: Node = null;

    @property({ type: Node })
    setting_btn: Node = null;

    @property({ type: Node })
    power_btn: Node = null;

    @property({ type: Node })
    pyq_btn: Node = null;

    @property({ type: Node })
    recommend_btn: Node = null;

    @property({ type: Node })
    chart_btn: Node = null;

    @property({ type: Label })
    power_label: Label = null;

    @property({ type: Label })
    power_tip: Label = null;

    private starPrefab: Prefab = null;
    private spawnedStars: Node[] = [];
    private spawnInterval: number = 12;  // 每秒刷新
    private maxStars: number = 10;  // 最多星星数量
    private minStarSpacing: number = 150;  // 星星最小间隔
    private btn_color1: Color = new Color(255, 230, 166);
    private btn_color2: Color = new Color(255, 183, 197);

    public levelConfig: LevelConfig | null = null;
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
     * @param level 关卡数
     * @param difficulty 难度模式（默认简单）
     */
    public updateLevelButtonText(level: number, difficulty: DifficultyMode = DifficultyMode.SIMPLE): void {
        const btnMap: Record<DifficultyMode, Node> = {
            [DifficultyMode.SIMPLE]: this.simple_btn,
            [DifficultyMode.MEDIUM]: this.medium_btn,
            [DifficultyMode.HARD]:   this.hard_btn,
        };
        const btn = btnMap[difficulty];
        if (!btn) return;

        const label = btn.children[0].getComponent(Label);
        const uiOpacity = btn.getComponent(UIOpacity) ?? btn.addComponent(UIOpacity);
        const hasLevel = this.levelConfig?.hasLevel(level, difficulty) ?? false;

        if (hasLevel) {
            label.string = `第${this.toChineseNum(level)}关`;
            uiOpacity.opacity = 255;
        } else {
            label.string = '敬请期待';
            uiOpacity.opacity = 128; // 置灰
        }
    }

    onLoad() {
        const gameManager = GameManager.getInstance();
        if (gameManager?.levelMode?.node) {
            gameManager.levelMode.node.active = false;
        }

        // 注册按钮事件（即使节点不激活也执行，确保 GameManager 能调用 loadLevel）
        if (this.simple_btn) {
            this.simple_btn.on(Node.EventType.TOUCH_END, this.onSimpleClick, this);
        }
        if (this.medium_btn) {
            this.medium_btn.on(Node.EventType.TOUCH_END, this.onMediumClick, this);
        }
        if (this.hard_btn) {
            this.hard_btn.on(Node.EventType.TOUCH_END, this.onHardClick, this);
        }

        if (this.setting_btn) {
            this.setting_btn.on(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
        if (this.power_btn) {
            this.power_btn.on(Node.EventType.TOUCH_END, this.onPowerBtnClick, this);
        }
        if (this.pyq_btn) {
            this.pyq_btn.on(Node.EventType.TOUCH_END, this.onPyqBtnClick, this);
        }
        if (this.recommend_btn) {
            this.recommend_btn.on(Node.EventType.TOUCH_END, this.onRecommendBtnClick, this);
        }
        if (this.chart_btn) {
            this.chart_btn.on(Node.EventType.TOUCH_END, this.onChartBtnClick, this);
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
        AudioManager.instance.playMenuBgm();

        // 在主页面显示原生模板广告
        WXManager.instance?.showNativeAd();
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
     * 难度按钮点击事件（通用）
     */
    private onDifficultyClick(difficulty: DifficultyMode): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager || (gameManager.gameState != GameState.WAITING)) return;
        if (gameManager.isWindowBlocking()) return;
        if (gameManager.power <= 0) {
            // 体力不足，打开窗口提示
            if (gameManager.window) {
                gameManager.window.showWithMessage(' 能量不足，请等待下次能量更新\n\n 或观看视频获取能量！');
            }
            return;
        }

        // 切换难度并获取对应关卡数
        gameManager.currentDifficulty = difficulty;
        const currentLevel = gameManager.currentLevel;

        // 检查关卡是否存在
        if (!this.levelConfig?.hasLevel(currentLevel, difficulty)) {
            gameManager.window.showWithMessage('关卡制作中...敬请期待！', false);
            return;
        }

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');
        AudioManager.instance.stopBgm();

        // 消耗体力
        gameManager.power--;

        console.log(`开始游戏 - ${difficulty} - 第${this.toChineseNum(currentLevel)}关`);
        this.loadLevel(currentLevel, difficulty);
    }

    /**
     * 简单模式点击事件
     */
    private onSimpleClick(): void {
        this.onDifficultyClick(DifficultyMode.SIMPLE);
    }

    /**
     * 中等模式点击事件
     */
    private onMediumClick(): void {
        this.onDifficultyClick(DifficultyMode.MEDIUM);
    }

    /**
     * 困难模式点击事件
     */
    private onHardClick(): void {
        this.onDifficultyClick(DifficultyMode.HARD);
    }

    /**
     * 设置按钮点击事件
     */
    private onSettingBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.setting || (gameManager.gameState != GameState.WAITING)) return;
        if (gameManager.isWindowBlocking()) return;

        gameManager.vibrateShort();
        gameManager.gameState = GameState.PAUSED;
        gameManager.setting.lastState = GameState.WAITING;
        const borderBg = gameManager.setting.border_bg;
        borderBg.getComponent(UITransform).setContentSize(600, 750);
        for (const child of borderBg.children) {
            child.getComponent(Widget)?.updateAlignment();
        }
        gameManager.setting.restart_btn.active = false;
        gameManager.setting.home_btn.active = false;
        gameManager.setting.node.active = true;
        AudioManager.instance.playEffect('setting_btn');
    }

    /**
     * 点击体力按钮，显示窗口
     */
    private onPowerBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.window || (gameManager.gameState != GameState.WAITING)) return;
        if (gameManager.isWindowBlocking()) return;

        gameManager.vibrateShort();
        gameManager.window.showWithMessage(' 看视频获得更多能量！');
        AudioManager.instance.playEffect('click_btn');
    }

    /**
     * 点击游戏圈按钮，打开游戏圈
     */
    private onPyqBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');
        WXManager.instance?.openGameClub();
    }

    /**
     * 点击推荐按钮，打开推荐位
     */
    private onRecommendBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');
        WXManager.instance?.openRecommend();
    }

    /**
     * 点击排行榜按钮，打开排行榜面板
     */
    private async onChartBtnClick(): Promise<void> {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.chart || (gameManager.gameState != GameState.WAITING)) return;
        if (gameManager.isWindowBlocking()) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        if (!gameManager.canOpenChartDirectly) {
            await gameManager.ensureChartProfileReady();
        }

        gameManager.chart.openDifficultyRanking(gameManager.currentDifficulty, false);
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
    public loadLevel(levelId: number, difficulty: DifficultyMode = DifficultyMode.SIMPLE): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('GameManager 未找到');
            return;
        }

        WXManager.instance?.hideNativeAd();
        WXManager.instance?.hideNativeGridAd();

        // 设置难度并获取关卡数据
        this.levelConfig?.setDifficulty(difficulty);
        // 同步 currentLevelIndex 与 levelId，保持一致
        this.levelConfig?.setCurrentLevelIndex(levelId - 1);
        const levelData = this.levelConfig?.getLevel(levelId, difficulty);
        if (!levelData) {
            console.error(`关卡 ${levelId} 不存在（难度: ${difficulty}）`);
            return;
        }

        const levelMode = gameManager.levelMode;
        const gridDrawer = levelMode?.gridDrawer;
        if (!levelMode || !gridDrawer) {
            console.error('LevelMode 或 GridDrawer 未找到');
            return;
        }

        this.showProgressPanel();

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
                                    gameManager.levelMode.level_label.string = `第${this.toChineseNum(levelId)}关`;
                                    console.log(`开始关卡: ${levelData.name}, 图案: ${levelData.patternPath}, 难度: ${difficulty}`);
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
        if (this.node) {
            this.node.active = true;
        }
        WXManager.instance?.setCaptureNone();
        WXManager.instance?.showNativeAd();
    }

    update(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !this.power_tip) return;

        if (gameManager.power >= 10) {
            this.power_tip.node.active = false;
        } else {
            this.power_tip.node.active = true;
            const remaining = gameManager.getPowerRegenRemaining();
            const totalSec = Math.ceil(remaining / 1000);
            const mins = Math.floor(totalSec / 60);
            const secs = totalSec % 60;
            const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
            this.power_tip.string = `距离下次更新：${mins}分${secsStr}秒`;
        }
    }

    onDestroy() {
        if (this.simple_btn) {
            this.simple_btn.off(Node.EventType.TOUCH_END, this.onSimpleClick, this);
        }
        if (this.medium_btn) {
            this.medium_btn.off(Node.EventType.TOUCH_END, this.onMediumClick, this);
        }
        if (this.hard_btn) {
            this.hard_btn.off(Node.EventType.TOUCH_END, this.onHardClick, this);
        }
        if (this.setting_btn) {
            this.setting_btn.off(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
        if (this.chart_btn) {
            this.chart_btn.off(Node.EventType.TOUCH_END, this.onChartBtnClick, this);
        }
    }
}
