import { _decorator, Component, Node, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { BlockController, BlockState } from './BlockController';
import { LevelMode } from './LevelMode';

const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {

    private _targetBlock: Node = null;       // 目标 block
    private _targetCircle: Node = null;      // 目标 circle
    private _ironNode: Node = null;          // 熨斗节点
    private _pauseTime: number = 0;          // 暂停时间
    private readonly _TIMEOUT: number = 3000; // 超时时间（5秒）
    private _isActive: boolean = false;     // 是否在引导中
    private _phase: number = 1;              // 引导阶段：1-拖动circle 2-使用熨斗
    public levelMode: LevelMode = null;
    onLoad() {
        // 确保手指节点初始隐藏
        const opacity = this.node.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
        }
    }

    /**
     * 开始引导
     * @param targetBlock 目标 block 节点
     * @param targetCircle 目标 circle 节点
     * @param ironNode 熨斗节点
     */
    public startTutorial(targetBlock: Node, targetCircle: Node, ironNode: Node): void {
        this._targetBlock = targetBlock;
        this._targetCircle = targetCircle;
        this._ironNode = ironNode;
        this._pauseTime = 0;
        this._isActive = true;
        this._phase = 1;

        this.playStepToCircle();
    }

    /**
     * 每帧检测
     */
    update(_deltaTime: number): void {
        const controller = this._targetBlock?.getComponent(BlockController);
        // 阶段1：检测 circle 是否已高亮
        if (this._phase === 1 && controller?.state === BlockState.HAS_CIRCLE) {
            // 进入熨斗引导阶段
            this._phase = 2;
            this._isActive = true;
            this._pauseTime = 0;
            this.playStepToCircle();
            return;
        }

        // 阶段2：检测 block 是否熨烫
        if(this._phase === 2 && controller?.state === BlockState.IRONED){
            this.endTutorial();
            return;
        }

        if (this._pauseTime <= 0) return;

        // 超时恢复
        if (Date.now() - this._pauseTime > this._TIMEOUT) {
            this._pauseTime = 0;
            this._isActive = true;
            this.playStepToCircle(); 
        }
    }


    /**
     * 手指移到 block 位置并淡出
     */
    private playStepToBlock(): void {
        if (!this._targetBlock || !this._targetBlock.isValid) {
            this.endTutorial();
            return;
        }
        const blockPos = this._targetBlock.getWorldPosition();
        const uiOpacity = this.node.getComponent(UIOpacity);
        tween(this.node)
            .to(0.7, { worldPosition: new Vec3(blockPos.x, blockPos.y, 0) })
            .call(() => {
                tween(uiOpacity).to(0.3, { opacity: 0 }).call(() => this.playStepToCircle()).start();
            })
            .start();
    }

    /**
     * 手指回到 circle 或熨斗位置并淡入
     */
    private playStepToCircle(): void {
        const uiOpacity = this.node.getComponent(UIOpacity);
        if (!this._isActive) {
            uiOpacity.opacity = 0;
            return;
        }
        const phase = this._phase;
        const target = phase === 1 ? this._targetCircle : this._ironNode;
        const worldPos = target.getWorldPosition();
        this.node.setWorldPosition(worldPos);

        tween(uiOpacity).to(0.3, { opacity: 255 }).call(() => this.playStepToBlock()).start();
    }

    /**
     * 暂停新手引导
     */
    public pauseTutorial(): void {
        this._isActive = false;
        this.node.getComponent(UIOpacity).opacity = 0;
    }

    public setPauseTime(): void {
        const controller = this._targetBlock?.getComponent(BlockController);
        if (this._phase === 1 && controller?.state === BlockState.HAS_CIRCLE) {
            this._phase = 2;
            this._isActive = true;
            this._pauseTime = 0;
            this.playStepToCircle();
            return;
        }
        if(this._phase === 2 && controller?.state === BlockState.IRONED){
            this.endTutorial();
            return;
        }
        this._pauseTime = Date.now();
    }

    /**
     * 结束新手引导
     */
    public endTutorial(): void {
        this.levelMode.tutorialController = null;
        this.node.destroy();
    }
}
