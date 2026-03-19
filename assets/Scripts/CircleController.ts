import { _decorator, Component, Node, Sprite, Color, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 圆形颜色控制器
 * 负责单个颜色节点的拖动和交互
 */
@ccclass('CircleController')
export class CircleController extends Component {
    // 原始位置
    private originalPos: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    // 拖动状态
    private isDragging: boolean = false;
    private dragOffset: { x: number, y: number } = { x: 0, y: 0 };

    // 颜色序号（从1开始）
    private _colorIndex: number = 0;
    public get colorIndex(): number { return this._colorIndex; }

    // 颜色数据
    private _colorR: number = 0;
    private _colorG: number = 0;
    private _colorB: number = 0;
    private _colorA: number = 0;

    onLoad() {
        // 保存原始位置
        const pos = this.node.position;
        this.originalPos = { x: pos.x, y: pos.y, z: pos.z };

        // 注册触摸事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDestroy() {
        // 移除触摸事件
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**
     * 设置颜色
     */
    public setColor(r: number, g: number, b: number, a: number, colorIndex: number): void {
        this._colorR = r;
        this._colorG = g;
        this._colorB = b;
        this._colorA = a;
        this._colorIndex = colorIndex;

        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(r, g, b, a);
        }
    }

    /**
     * 获取颜色数据
     */
    public getColor(): { r: number, g: number, b: number, a: number } {
        return { r: this._colorR, g: this._colorG, b: this._colorB, a: this._colorA };
    }

    /**
     * 重置位置
     */
    public resetPosition(): void {
        this.node.setPosition(this.originalPos.x, this.originalPos.y, this.originalPos.z);
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        this.isDragging = true;
        const pos = event.getUILocation();
        const nodePos = this.node.position;
        this.dragOffset = { x: pos.x - nodePos.x, y: pos.y - nodePos.y };
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;

        const pos = event.getUILocation();
        const newX = pos.x - this.dragOffset.x;
        const newY = pos.y - this.dragOffset.y;
        this.node.setPosition(newX, newY, 0);
    }

    /**
     * 触摸结束
     */
    private onTouchEnd(_event: EventTouch) {
        this.isDragging = false;
        // 恢复到原始位置
        this.resetPosition();
    }
}
