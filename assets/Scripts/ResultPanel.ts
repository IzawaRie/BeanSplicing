import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Texture2D, ImageAsset, UITransform, tween, Tween, Vec3, UIOpacity } from 'cc';
import { GameManager, GameState, DifficultyMode } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { AudioManager } from './AudioManager';
import { LevelConfig } from './LevelConfig';
import { GridDrawer } from './GridDrawer';
import { PlayerService } from './PlayerService';
import { WXManager } from './WXManager';
const { ccclass, property } = _decorator;

@ccclass('ResultPanel')
export class ResultPanel extends Component {

    @property(Node)
    content: Node = null;

    @property(Node)
    successNode:Node = null;

    @property(Node)
    failNode:Node = null;

    @property(Node)
    nextLevelBtn: Node = null;

    @property(Node)
    restartBtn: Node = null;

    @property(Node)
    restartBtn2: Node = null;

    @property(Node)
    homelBtn: Node = null;

    @property(Node)
    homelBtn2: Node = null;

    @property(Node)
    camera_btn: Node = null;

    @property(Node)
    camera_btn2: Node = null;

    @property(Node)
    share_btn: Node = null;

    @property(Node)
    share_btn2: Node = null;

    @property(Node)
    flashNode: Node = null;

    @property(Node)
    continue_btn: Node = null;

    @property(Node)
    chart_btn: Node = null;

    @property(Node)
    chart_btn2: Node = null;

    @property(Sprite)
    result_img: Sprite = null;

    @property(Label)
    right_number: Label = null;

    @property(Label)
    wrong_number: Label = null;

    @property(Label)
    percent_number: Label = null;

    @property(Label)
    highlight_percent: Label = null;

    @property(Label)
    iron_percent: Label = null;

    @property(Label)
    time_number: Label = null;

    @property({ type: Label })
    coin_label: Label = null;

    /** 标记当前结果是否为成功 */
    private _isSuccess: boolean = false;

    /** 保存的截图数据 */
    private _screenshotData: { width: number; height: number; byteArray: Uint8Array } | null = null;

    /** 游戏开始时间（毫秒） */
    private _gameStartTime: number = 0;

    /** 累计暂停时间（毫秒）- 不计算结果显示页面的时间 */
    private _pausedTime: number = 0;

    /** 暂停开始时间（毫秒）- 记录结果页面开始显示的时间 */
    private _pauseStartTime: number = 0;

    /** 本次通关用时（秒） */
    private _clearTime: number = 0;

    private _resultDifficulty: DifficultyMode = DifficultyMode.SIMPLE;

    private _resultLevelNo: number = 1;

    private _saveLevelDataTask: Promise<void> | null = null;
    private _coinTweenState: { value: number } | null = null;
    private readonly _COIN_COUNT_ANIM_DURATION: number = 2;
    private _lastCoinBoopTime: number = 0;
    private readonly _COIN_COUNT_BOOP_INTERVAL_MS: number = 100;

    /**
     * 设置成功状态，并更新界面文字
     */
    public setResult(isSuccess: boolean): void {
        this._isSuccess = isSuccess;
        const gameManager = GameManager.getInstance();
        const baseCoinCount = gameManager.coinCount;
        const rewardCoinCount = isSuccess ? (gameManager.levelMode?.levelCoinCount ?? 0) : 0;
        const difficulty = gameManager.currentDifficulty;
        const playedLevelNo = gameManager.levelMode?.currentLevelId ?? gameManager.currentLevel;
        this._resultDifficulty = difficulty;
        this._resultLevelNo = playedLevelNo;
        gameManager.levelMode.stop30SecondWarning();
        // 结束可能正在进行的新手引导
        const tutorialController = gameManager.levelMode?.tutorialController;
        if (tutorialController) {
            tutorialController.endTutorial();
        }

        // 记录结果页面开始显示的时间（用于排除结果显示页面的时间）
        this._pauseStartTime = Date.now();

        // 计算通关时间（无论成功或失败都计算）
        if (this._gameStartTime > 0) {
            const totalTime = Date.now() - this._gameStartTime;
            const actualTime = Math.max(0, totalTime - this._pausedTime);
            this._clearTime = Math.max(0, Math.floor(actualTime / 1000));
        } else {
            this._clearTime = 0;
        }

        // 统计正确/错误/正确率
        this.updateResultStats();

        // 隐藏六个数据 label 的父节点
        this.hideResultLabelParents();

        this.successNode.active = isSuccess ? true : false;
        this.failNode.active = (!isSuccess) ? true : false;

        if (isSuccess) {
            AudioManager.instance.playEffect('victory', 0.4);

            // 保存关卡数据到云端
            const levelNo = this._resultLevelNo;
            this._saveLevelDataTask = this.saveLevelDataToCloud(difficulty, levelNo, this._clearTime);
            gameManager.unlockBookIdsThroughLevel(difficulty, levelNo);

            // 更新当前关卡
            const nextLevelNo = levelNo + 1;
            if (gameManager.currentLevel <= levelNo) {
                gameManager.currentLevel = nextLevelNo;
            }

            // 检查是否还有下一关
            const hasNextLevel = LevelConfig.getInstance().hasLevel(nextLevelNo, difficulty);
            if (hasNextLevel) {
                // 有下一关，显示下一关按钮，隐藏返回按钮
                this.nextLevelBtn.active = true;
                this.homelBtn2.active = true;
            } else {
                // 没有下一关，隐藏下一关按钮，居中返回按钮
                this.nextLevelBtn.active = false;
                this.homelBtn2.active = true;
            }
        } else {
            this._saveLevelDataTask = null;
            AudioManager.instance.playEffect('game-fail', 0.7);
        }

        // 播放缩放入场动画，动画完成后生成结果图片
        if (isSuccess && rewardCoinCount > 0) {
            this.playCoinCountAnimation(baseCoinCount, baseCoinCount + rewardCoinCount);
        } else {
            this.setCoinLabelValue(baseCoinCount);
        }
        this.playContentEnterAnimation();
        WXManager.instance?.setCaptureNone();
        WXManager.instance?.hideNativeGridAd();
    }

    private setCoinLabelValue(value: number): void {
        if (this.coin_label) {
            this.coin_label.string = `${Math.max(0, Math.floor(value))}`;
        }
    }

    private playCoinCountAnimation(startValue: number, endValue: number): void {
        if (this._coinTweenState) {
            Tween.stopAllByTarget(this._coinTweenState);
            this._coinTweenState = null;
        }

        this._lastCoinBoopTime = 0;
        this.setCoinLabelValue(startValue);
        if (endValue <= startValue) {
            this.setCoinLabelValue(endValue);
            return;
        }

        const tweenState = { value: startValue };
        this._coinTweenState = tweenState;
        tween(tweenState)
            .to(this._COIN_COUNT_ANIM_DURATION, { value: endValue }, {
                easing: 'quadOut',
                onUpdate: (target: { value: number }) => {
                    this.tryPlayCoinBoop(target.value);
                    this.setCoinLabelValue(target.value);
                },
            })
            .call(() => {
                this.setCoinLabelValue(endValue);
                if (this._coinTweenState === tweenState) {
                    this._coinTweenState = null;
                }
            })
            .start();
    }

    /**
     * 在金币数字发生变化时播放音效，并限制最短播放间隔。
     */
    private tryPlayCoinBoop(nextValue: number): void {
        if (!this.coin_label) {
            return;
        }

        const nextLabelValue = `${Math.max(0, Math.floor(nextValue))}`;
        if (this.coin_label.string === nextLabelValue) {
            return;
        }

        const now = Date.now();
        if (this._lastCoinBoopTime > 0 && now - this._lastCoinBoopTime < this._COIN_COUNT_BOOP_INTERVAL_MS) {
            return;
        }

        AudioManager.instance?.playEffect('boop');
        this._lastCoinBoopTime = now;
    }

    /**
     * 记录游戏开始时间（在游戏开始时调用）
     */
    public recordGameStartTime(): void {
        this._gameStartTime = Date.now();
        this._pausedTime = 0;
        this._pauseStartTime = 0;
        this._clearTime = 0;
        this._saveLevelDataTask = null;
    }

    /**
     * 统计正确/错误格子和正确率
     */
    private updateResultStats(): void {
        const gameManager = GameManager.getInstance();
        const gridDrawer = gameManager.levelMode?.gridDrawer;
        if (!gridDrawer) return;

        const blocks = gridDrawer.getAllBlocks();
        if (!blocks) return;

        let rightCount = 0;
        let wrongCount = 0;
        let totalCount = 0;
        let highlightedCount = 0;  // 高亮数（HAS_CIRCLE状态）
        let ironedCount = 0;       // 熨烫数（IRONED状态）

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const controller = block.getComponent(BlockController);
                if (!controller) continue;

                // 只统计有效 block（目标颜色不透明）
                if (controller.targetColorA <= 0) continue;

                totalCount++;

                // 统计高亮和熨烫状态
                if (controller.state === BlockState.HAS_CIRCLE || controller.state === BlockState.IRONING) {
                    highlightedCount++;
                } else if (controller.state === BlockState.IRONED) {
                    ironedCount++;
                    highlightedCount++; // 已熨烫的也算入高亮数
                    // 检查是否已熨烫且颜色正确
                    if (controller.isColorMatch()) {
                        rightCount++;
                    } else {
                        wrongCount++;
                    }
                } else {
                    // 其他状态（NONE或未匹配）也算错误
                    wrongCount++;
                }
            }
        }

        // 计算正确率
        const percent = totalCount > 0 ? Math.floor((rightCount / totalCount) * 100) : 0;

        // 计算高亮率
        const highlightPercent = totalCount > 0 ? Math.floor((highlightedCount / totalCount) * 100) : 0;

        // 计算熨烫率
        const ironPercent = totalCount > 0 ? Math.floor((ironedCount / totalCount) * 100) : 0;

        // 使用已计算的通关时间
        const timeUsed = this._clearTime;

        // 更新 Label 显示
        if (this.right_number) {
            this.right_number.string = `${rightCount}/${totalCount}`;
        }
        if (this.wrong_number) {
            this.wrong_number.string = `${wrongCount}/${totalCount}`;
        }
        if (this.percent_number) {
            this.percent_number.string = `${percent}%`;
        }
        if (this.highlight_percent) {
            this.highlight_percent.string = `${highlightPercent}%`;
        }
        if (this.iron_percent) {
            this.iron_percent.string = `${ironPercent}%`;
        }
        if (this.time_number) {
            // 格式化为 "XXs"
            this.time_number.string = `${timeUsed}s`;
        }

        console.log(`结果统计: 正确=${rightCount}, 错误=${wrongCount}, 正确率=${percent}%, 高亮率=${highlightPercent}%, 熨烫率=${ironPercent}%, 用时=${timeUsed}秒`);
    }

    /**
     * 隐藏六个数据 label 的父节点（将 opacity 设为 0）
     */
    private hideResultLabelParents(): void {
        const labels = [
            this.highlight_percent,
            this.iron_percent,
            this.time_number,
            this.right_number,
            this.wrong_number,
            this.percent_number
        ];

        for (const label of labels) {
            if (label && label.node.parent) {
                let uiOpacity = label.node.parent.getComponent(UIOpacity);
                if (!uiOpacity) {
                    uiOpacity = label.node.parent.addComponent(UIOpacity);
                }
                uiOpacity.opacity = 0;
            }
        }
    }

    /**
     * 依次显示六个数据 Label（每个间隔 0.1 秒）
     * 顺序：highlight_percent, iron_percent, time_number, right_number, wrong_number, percent_number
     */
    private showResultLabelsSequentially(): void {
        const labels: { item: Node, index: number }[] = [
            { item: this.highlight_percent.node.parent, index: 0 },
            { item: this.iron_percent.node.parent, index: 1 },
            { item: this.time_number.node.parent, index: 2 },
            { item: this.right_number.node.parent, index: 0 },
            { item: this.wrong_number.node.parent, index: 1 },
            { item: this.percent_number.node.parent, index: 2 }
        ];

        const delay = 0.15; // 间隔 0.1 秒
        
        for (const item of labels) {
            if (item.item) {
                // 获取或添加 UIOpacity 组件
                let uiOpacity = item.item.getComponent(UIOpacity);
                
                // 延迟显示
                this.scheduleOnce(() => {
                    tween(uiOpacity)
                        .to(0.3, { opacity: 255 })
                        .start();
                }, item.index * delay);
            }
        }
    }

    /**
     * content 缩放入场动画：从 0 到 1
     */
    private playContentEnterAnimation(): void {
        if (!this.content) return;

        const gameManager = GameManager.getInstance();
        if (!gameManager?.levelMode?.gridDrawer) return;
        // 隐藏原始画布
        const drawerOpacity = gameManager.levelMode.drawer_opacity;
        drawerOpacity.opacity = 0;
        // 先设置为 0
        this.content.setScale(0, 0, 1);

        // 动画到 1，动画完成后生成结果图片，然后依次显示 Label
        tween(this.content)
            .to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' })
            .call(() => {
                this.generateResultImage();
                // tween 完成后，依次显示六个数据 Label
                this.showResultLabelsSequentially();
            })
            .start();
    }

    /**
     * 从 BlockCreator 获取所有 block 的当前颜色，并绘制到 result_img
     */
    private generateResultImage(): void {
        if (!this.result_img) return;

        const gameManager = GameManager.getInstance();
        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();
        if (!blocks || blocks.length === 0) return;

        const rows = blocks.length;
        const cols = blocks[0].length;

        const uiTransform = this.result_img.getComponent(UITransform);
        if (!uiTransform) return;

        // 获取显示尺寸
        const displayWidth = uiTransform.width;
        const displayHeight = uiTransform.height;

        // 计算每个像素需要放大的倍数
        const scaleX = displayWidth / cols;
        const scaleY = displayHeight / rows;

        // 纹理尺寸
        const textureWidth = Math.floor(displayWidth);
        const textureHeight = Math.floor(displayHeight);

        // 创建像素数据
        const byteCount = textureWidth * textureHeight * 4;
        const buffer = new ArrayBuffer(byteCount);
        const byteArray = new Uint8Array(buffer, 0, byteCount);

        // 初始化为白色背景
        for (let i = 0; i < byteCount; i += 4) {
            byteArray[i] = 255;     // R
            byteArray[i + 1] = 255; // G
            byteArray[i + 2] = 255; // B
            byteArray[i + 3] = 255; // A
        }

        // 填充像素数据
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (!blockController) continue;

                // 获取当前颜色
                let r: number, g: number, b: number, a: number = 0;

                // 优先使用 BlockController 的当前颜色
                if (blockController.currentColorA >= 0 && blockController.state == BlockState.IRONED) {
                    r = blockController.currentColorR;
                    g = blockController.currentColorG;
                    b = blockController.currentColorB;
                    a = blockController.currentColorA;
                }

                // 计算这个 block 在纹理上的起始和结束位置
                const startX = Math.floor(col * scaleX);
                const startY = Math.floor(row * scaleY);
                const endX = Math.floor((col + 1) * scaleX);
                const endY = Math.floor((row + 1) * scaleY);

                // 填充对应的像素
                for (let y = startY; y < endY && y < textureHeight; y++) {
                    for (let x = startX; x < endX && x < textureWidth; x++) {
                        const pixelIndex = (y * textureWidth + x) * 4;

                        if (a > 0) {
                            byteArray[pixelIndex] = r;
                            byteArray[pixelIndex + 1] = g;
                            byteArray[pixelIndex + 2] = b;
                            byteArray[pixelIndex + 3] = a;
                        } else {
                            // 默认填充白色背景
                            byteArray[pixelIndex] = 255;
                            byteArray[pixelIndex + 1] = 255;
                            byteArray[pixelIndex + 2] = 255;
                            byteArray[pixelIndex + 3] = 255;
                        }
                    }
                }
            }
        }

        // 创建 ImageAsset
        const imgAsset = new ImageAsset();
        imgAsset.reset({
            _data: byteArray,
            _compressed: true,
            width: textureWidth,
            height: textureHeight,
            format: Texture2D.PixelFormat.RGBA8888
        });

        // 创建 Texture2D
        const texture = new Texture2D();
        texture.image = imgAsset;
        texture.uploadData(byteArray, 0);

        // 创建 SpriteFrame 并应用
        const spriteFrame = new (SpriteFrame as any)();
        spriteFrame.texture = texture;

        // 设置纹理过滤模式为 Nearest
        texture.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);

        // 禁用动态图集
        (spriteFrame as any)._packable = false;

        // 先设置为 0
        this.result_img.spriteFrame = spriteFrame;
        this.result_img.fillRange = 0;

        // 动画填充范围从 0 到 1
        tween(this.result_img)
            .to(0.5, { fillRange: 1 }, { easing: 'sineInOut' })
            .call(() => {
                this.scheduleOnce(() => {
                    void this.handleResultPageOpenAbility();
                }, 0.5);
            })
            .start();

        // 保存截图数据，供拍照按钮使用
        this._screenshotData = { width: textureWidth, height: textureHeight, byteArray };

        console.log(`结果图片已生成: ${textureWidth}x${textureHeight}`);
    }

    /**
     * 点击拍照按钮
     */
    /**
     * 结果页打开后，通关时优先尝试插屏广告；
     * 只有没有打开插屏广告时，才尝试展示游戏评价。
     */
    private async handleResultPageOpenAbility(): Promise<void> {
        if (!this._isSuccess) {
            return;
        }

        const wxManager = WXManager.instance;
        if (!wxManager) {
            return;
        }

        const interstitialShown = await wxManager.showInterstitialAd();
        if (interstitialShown) {
            return;
        }

        wxManager.tryShowGameEvaluation();
    }

    private onCameraBtnClick(): void {
        // 播放音效
        AudioManager.instance.playEffect('camera_shutter');

        // 闪白效果
        this.playFlashEffect(() => {
            // 闪白结束后，保存图片
            if (this._screenshotData) {
                WXManager.instance?.saveImageToPhotosAlbum(
                    this._screenshotData.width,
                    this._screenshotData.height,
                    this._screenshotData.byteArray
                );
            }
        });
    }

    /**
     * 点击分享按钮
     */
    private onShareBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;

        AudioManager.instance.playEffect('click_btn');
        const currentLevel = gameManager.currentLevel;
        const difficulty = gameManager.currentDifficulty;

        let difficultyText = '';
        switch (difficulty) {
            case 'simple': difficultyText = '简单难度'; break;
            case 'medium': difficultyText = '进阶难度'; break;
            case 'hard': difficultyText = '高手难度'; break;
            default: difficultyText = difficulty;
        }

        const content = this._isSuccess ? '太简单了，你也来试试' : '好难，快来帮我通关';

        WXManager.instance?.shareAppMessage(`${difficultyText}第${currentLevel}关${content}!`)
            .catch(() => console.log('分享失败或取消'));
    }

    /**
     * 模拟快门闪白效果
     */
    private playFlashEffect(callback?: () => void): void {
        if (!this.flashNode) {
            callback?.();
            return;
        }

        const uiOpacity = this.flashNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            callback?.();
            return;
        }

        // 先设置为完全白色不透明
        uiOpacity.opacity = 255;

        // 快速淡出
        tween(uiOpacity)
            .to(0.3, { opacity: 0 })
            .call(() => {
                callback?.();
            })
            .start();
    }

    start() {
        this.nextLevelBtn?.on(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.on(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);
        this.restartBtn2?.on(Node.EventType.TOUCH_END, this.onAgainLevelBtnClick, this);
        this.homelBtn?.on(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
        this.homelBtn2?.on(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
        this.camera_btn?.on(Node.EventType.TOUCH_END, this.onCameraBtnClick, this);
        this.camera_btn2?.on(Node.EventType.TOUCH_END, this.onCameraBtnClick, this);
        this.share_btn?.on(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.share_btn2?.on(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.continue_btn?.on(Node.EventType.TOUCH_END, this.onContinueBtnClick, this);
        this.chart_btn?.on(Node.EventType.TOUCH_END, this.onChartBtnClick, this);
        this.chart_btn2?.on(Node.EventType.TOUCH_END, this.onChartBtnClick, this);
    }

    onDestroy() {
        if (this._coinTweenState) {
            Tween.stopAllByTarget(this._coinTweenState);
            this._coinTweenState = null;
        }
        this.nextLevelBtn?.off(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.off(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);
        this.restartBtn2?.off(Node.EventType.TOUCH_END, this.onAgainLevelBtnClick, this);
        this.homelBtn2?.off(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
        this.camera_btn?.off(Node.EventType.TOUCH_END, this.onCameraBtnClick, this);
        this.camera_btn2?.off(Node.EventType.TOUCH_END, this.onCameraBtnClick, this);
        this.share_btn?.off(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.share_btn2?.off(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.continue_btn?.off(Node.EventType.TOUCH_END, this.onContinueBtnClick, this);
        this.chart_btn?.off(Node.EventType.TOUCH_END, this.onChartBtnClick, this);
        this.chart_btn2?.off(Node.EventType.TOUCH_END, this.onChartBtnClick, this);
    }

    /**
     * nextLevelBtn 点击事件 - 进入下一关
     */
    private onNextLevelBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        if (gameManager.power <= 0) {
            gameManager.window.showWithMessage(' 能量不足，请等待下次能量更新\n\n 或观看视频获取能量！');
            return;
        }
        gameManager.power--;
        AudioManager.instance.playEffect('ding');
        this.loadLevel(this._resultLevelNo + 1, this._resultDifficulty);
    }

    /**
     * restartBtn 点击事件 - 重新开始游戏
     */
    private onRestartLevelBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        if (gameManager.power <= 0) {
            gameManager.window.showWithMessage(' 能量不足，请等待下次能量更新\n\n 或观看视频获取能量！');
            return;
        }
        gameManager.power--;
        AudioManager.instance.playEffect('click_btn');
        this.loadLevel(this._resultLevelNo, this._resultDifficulty);
    }

    /**
     * restartBtn 点击事件 - 再来一次
     */
    private onAgainLevelBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;

        AudioManager.instance.playEffect('click_btn');
        this.loadLevel(this._resultLevelNo, this._resultDifficulty);
    }

    private loadLevel(levelNo: number = GameManager.getInstance()?.currentLevel ?? 1, difficulty: DifficultyMode = GameManager.getInstance()?.currentDifficulty ?? DifficultyMode.SIMPLE){
        this.result_img.spriteFrame = null;
        this.node.active = false;
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.node.active = false;
        gameManager.vibrateShort();
        gameManager.menuManager.loadLevel(levelNo, difficulty);
    }

    private async onChartBtnClick(): Promise<void> {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.chart) return;
        if (gameManager.isWindowBlocking()) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        if (!gameManager.canOpenChartDirectly) {
            await gameManager.ensureChartProfileReady();
        }

        if (this._isSuccess && this._saveLevelDataTask) {
            await this._saveLevelDataTask;
        }

        WXManager.instance?.hideNativeAd();
        gameManager.chart.openLevelRanking(this._resultDifficulty, this._resultLevelNo, this._isSuccess, false);
    }

    private onShowHomePanel(){
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        AudioManager.instance.playEffect('click_btn');
        this.result_img.spriteFrame = null;
        this.node.active = false;
        gameManager.vibrateShort();
        gameManager.gameState = GameState.WAITING;
        gameManager.levelMode.node.active = false;
        gameManager.menuManager.node.active = true;
        WXManager.instance?.showNativeAd();
        WXManager.instance?.showNativeGridAd(0.14);
        AudioManager.instance.playMenuBgm();
    }

    /**
     * 保存关卡数据到云端
     */
    private async saveLevelDataToCloud(difficulty: DifficultyMode, levelNo: number, clearTime: number): Promise<void> {
        const playerService = PlayerService.instance;
        if (!playerService) return;
        const gameManager = GameManager.getInstance();

        // 保存单关最佳成绩
        const saveBestSuccess = await playerService.saveLevelBest(difficulty, levelNo, clearTime);
        if (saveBestSuccess) {
            console.log(`关卡数据已保存: ${levelNo}关, ${clearTime}秒`);
        }

        // 更新难度最高关卡（如果这是新最高关卡）
        const updateHighestSuccess = await playerService.updateHighestLevelIfBetter(difficulty, levelNo);
        if (updateHighestSuccess) {
            console.log(`最高关卡已更新: ${levelNo}`);
        }

        await gameManager?.chart?.preloadAllRankings(true);
    }

    /**
     * continue_btn 点击事件 - 继续游戏
     */
    private onContinueBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        if (gameManager.power <= 0) {
            gameManager.window.showWithMessage(' 能量不足，请等待下次能量更新\n\n 或观看视频获取能量！');
            return;
        }
        gameManager.power--;
        AudioManager.instance.playEffect('click_btn');
        
        // 累加本次结果页面的暂停时间
        if (this._pauseStartTime > 0) {
            this._pausedTime += Date.now() - this._pauseStartTime;
            this._pauseStartTime = 0;
        }
        
        // 隐藏结果面板
        this.result_img.spriteFrame = null;
        this.node.active = false;
        
        // 获取 LevelMode
        const levelMode = gameManager.levelMode;
        if (levelMode) {
            if (levelMode.coin_border) {
                levelMode.coin_border.active = true;
            }
            // 恢复画布透明度
            levelMode.drawer_opacity.opacity = 255;
            // 重置30秒警告状态
            levelMode.stop30SecondWarning();
            
            // 重置格子状态：已熨烫的格子退回高亮状态，显示圆圈，隐藏熨烫图片
            const gridDrawer = levelMode.gridDrawer;
            if (gridDrawer) {
                // 显示所有圆圈（已熨烫的格子退回高亮状态）
                gridDrawer.showAllBlockCircles();
                // 隐藏所有熨烫图片（通过隐藏 block sprites）
                gridDrawer.hideAllBlockSpritesInstant();
            }
            
            // 重置进度到初始高亮状态（所有格子都是高亮，所以进度为50%）
            levelMode.resetProgressToHighlighted();
            // 重启倒计时
            levelMode.startCountdown();
            // 恢复游戏状态
            gameManager.gameState = GameState.PLAYING;
        }
        
        AudioManager.instance.playGameBgm();
        WXManager.instance?.showNativeGridAd(0.14);
        gameManager.vibrateShort();
    }
}
