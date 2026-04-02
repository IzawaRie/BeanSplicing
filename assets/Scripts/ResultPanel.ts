import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Texture2D, ImageAsset, UITransform, tween, Vec3 } from 'cc';
import { GameManager, GameState, DifficultyMode } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { AudioManager } from './AudioManager';
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

    @property(Sprite)
    result_img: Sprite = null;

    /** 标记当前结果是否为成功 */
    private _isSuccess: boolean = false;

    /**
     * 设置成功状态，并更新界面文字
     */
    public setResult(isSuccess: boolean): void {
        this._isSuccess = isSuccess;

        this.successNode.active = isSuccess ? true : false;
        this.failNode.active = (!isSuccess) ? true : false;
        if(isSuccess){
            AudioManager.instance.playEffect('victory', 0.4);
            GameManager.getInstance().currentLevel++;
        }else{
            AudioManager.instance.playEffect('game-fail', 0.7);
        }

        // 播放缩放入场动画，动画完成后生成结果图片
        this.playContentEnterAnimation();
    }

    /**
     * content 缩放入场动画：从 0 到 1
     */
    private playContentEnterAnimation(): void {
        if (!this.content) return;

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
        if (!gameManager?.levelMode?.gridDrawer) return;

        // 隐藏原始画布
        const drawerOpacity = gameManager.levelMode.drawer_opacity;
        drawerOpacity.opacity = 0;

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
                            // 默认透明
                            byteArray[pixelIndex] = 0;
                            byteArray[pixelIndex + 1] = 0;
                            byteArray[pixelIndex + 2] = 0;
                            byteArray[pixelIndex + 3] = 0;
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
            .start();

        console.log(`结果图片已生成: ${textureWidth}x${textureHeight}`);
    }

    start() {
        this.nextLevelBtn?.on(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.on(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);
        this.homelBtn?.on(Node.EventType.TOUCH_END, this.onShowHomePanel, this);

    }

    onDestroy() {
        this.nextLevelBtn?.off(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.off(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);
        this.homelBtn?.off(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
    }

    /**
     * nextLevelBtn 点击事件 - 进入下一关
     */
    private onNextLevelBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        AudioManager.instance.playEffect('ding');
        this.loadLevel();
    }

    /**
     * restartBtn 点击事件 - 重新开始游戏
     */
    private onRestartLevelBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.isWindowBlocking()) return;
        AudioManager.instance.playEffect('click_btn');
        this.loadLevel();
    }

    private loadLevel(){
        this.result_img.spriteFrame = null;
        this.node.active = false;
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.node.active = false;
        gameManager.vibrateShort();
        gameManager.menuManager.showProgressPanel();
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
        AudioManager.instance.playBgm();
    }
}
