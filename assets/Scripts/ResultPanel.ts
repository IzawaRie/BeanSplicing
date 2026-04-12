import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Texture2D, ImageAsset, UITransform, tween, Vec3, UIOpacity } from 'cc';
import { GameManager, GameState, DifficultyMode } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { AudioManager } from './AudioManager';
import { LevelConfig } from './LevelConfig';
import { WXManager } from './WXManager';
import { GridDrawer } from './GridDrawer';
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
    homelBtn: Node = null;

    @property(Node)
    homelBtn2: Node = null;

    @property(Node)
    camera_btn: Node = null;

    @property(Node)
    share_btn: Node = null;

    @property(Node)
    share_btn2: Node = null;

    @property(Node)
    flashNode: Node = null;

    @property(Node)
    continue_btn: Node = null;

    @property(Sprite)
    result_img: Sprite = null;

    /** 标记当前结果是否为成功 */
    private _isSuccess: boolean = false;

    /** 保存的截图数据 */
    private _screenshotData: { width: number; height: number; byteArray: Uint8Array } | null = null;

    /**
     * 设置成功状态，并更新界面文字
     */
    public setResult(isSuccess: boolean): void {
        this._isSuccess = isSuccess;
        const gameManager = GameManager.getInstance();
        const difficulty = gameManager.currentDifficulty;
        gameManager.levelMode.stop30SecondWarning();
        // 结束可能正在进行的新手引导
        const tutorialController = gameManager.levelMode?.tutorialController;
        if (tutorialController) {
            tutorialController.endTutorial();
        }

        this.successNode.active = isSuccess ? true : false;
        this.failNode.active = (!isSuccess) ? true : false;

        if (isSuccess) {
            AudioManager.instance.playEffect('victory', 0.4);
            gameManager.currentLevel++;

            // 检查是否还有下一关
            const hasNextLevel = LevelConfig.getInstance().hasLevel(gameManager.currentLevel, difficulty);
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
            AudioManager.instance.playEffect('game-fail', 0.7);
        }

        // 播放缩放入场动画，动画完成后生成结果图片
        this.playContentEnterAnimation();
        WXManager.instance?.setCaptureNone();
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

        // 动画到 1，动画完成后生成结果图片
        tween(this.content)
            .to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' })
            .call(() => {
                this.generateResultImage();
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
                    WXManager.instance.showInterstitialAd();
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
        this.homelBtn?.on(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
        this.homelBtn2?.on(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
        this.camera_btn?.on(Node.EventType.TOUCH_END, this.onCameraBtnClick, this);
        this.share_btn?.on(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.share_btn2?.on(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.continue_btn?.on(Node.EventType.TOUCH_END, this.onContinueBtnClick, this);
    }

    onDestroy() {
        this.nextLevelBtn?.off(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.off(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);
        this.homelBtn2?.off(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
        this.camera_btn?.off(Node.EventType.TOUCH_END, this.onCameraBtnClick, this);
        this.share_btn?.off(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.share_btn2?.off(Node.EventType.TOUCH_END, this.onShareBtnClick, this);
        this.continue_btn?.off(Node.EventType.TOUCH_END, this.onContinueBtnClick, this);
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
        this.loadLevel();
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
        this.loadLevel();
    }

    private loadLevel(){
        this.result_img.spriteFrame = null;
        this.node.active = false;
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.node.active = false;
        gameManager.vibrateShort();
        gameManager.menuManager.loadLevel(gameManager.currentLevel, gameManager.currentDifficulty);
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
        AudioManager.instance.playMenuBgm();
    }

    /**
     * continue_btn 点击事件 - 继续游戏，倒计时重置为60秒
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
        
        // 隐藏结果面板
        this.result_img.spriteFrame = null;
        this.node.active = false;
        
        // 获取 LevelMode
        const levelMode = gameManager.levelMode;
        if (levelMode) {
            // 恢复画布透明度
            levelMode.drawer_opacity.opacity = 255;
            // 重置倒计时为60秒
            levelMode['_remainingTime'] = 60;
            // 重置30秒警告状态
            levelMode.stop30SecondWarning();
            levelMode['_is30SecondWarning'] = false;
            // 重置30秒警告计时器
            levelMode['_30SecondWarningTimer'] = 0;
            
            // 重置所有格子状态：改成高亮状态，显示圆圈，隐藏熨烫图片
            const gridDrawer = levelMode.gridDrawer;
            if (gridDrawer) {
                const blocks = gridDrawer.getAllBlocks();
                if (blocks) {
                    for (let row = 0; row < blocks.length; row++) {
                        for (let col = 0; col < blocks[row].length; col++) {
                            const block = blocks[row][col];
                            if (!block) continue;
                            const controller = block.getComponent(BlockController);
                            if (!controller) continue;
                            // 只处理有效 block（目标颜色不透明）
                            if (controller.targetColorA <= 0) continue;
                            // 重置为 HAS_CIRCLE 状态
                            controller.state = BlockState.HAS_CIRCLE;
                        }
                    }
                    // 显示所有圆圈
                    gridDrawer.showAllBlockCircles();
                    // 隐藏所有熨烫图片（通过隐藏 block sprites）
                    gridDrawer.hideAllBlockSpritesInstant();
                }
            }
            
            // 重置进度到初始高亮状态（所有格子都是高亮，所以进度为50%）
            levelMode.resetProgressToHighlighted();
            // 重启倒计时
            levelMode.startCountdown();
            // 恢复游戏状态
            gameManager.gameState = GameState.PLAYING;
        }
        
        gameManager.vibrateShort();
    }
}
