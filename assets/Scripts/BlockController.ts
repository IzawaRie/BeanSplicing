import { _decorator, Component, Node, Sprite } from 'cc';
const { ccclass } = _decorator;

/**
 * Block 状态枚举
 */
export enum BlockState {
    NO_CIRCLE = 0,    // 无 circle
    HAS_CIRCLE = 1,  // 有 circle（未熨烫）
    IRONED = 2       // 已熨烫
}

@ccclass('BlockController')
export class BlockController extends Component {
    private _row: number = 0;
    private _col: number = 0;
    private _gridWidth: number = 0;

    // 目标颜色（JSON 图案颜色）
    private _targetColorR: number = 0;
    private _targetColorG: number = 0;
    private _targetColorB: number = 0;
    private _targetColorA: number = 0;

    // 当前颜色（circle 放置后的颜色）
    private _currentColorR: number = 0;
    private _currentColorG: number = 0;
    private _currentColorB: number = 0;
    private _currentColorA: number = 0;

    // Block 状态
    private _state: BlockState = BlockState.NO_CIRCLE;

    /**
     * 设置 block 的行列信息
     */
    setPosition(row: number, col: number, gridWidth: number = 0): void {
        this._row = row;
        this._col = col;
        this._gridWidth = gridWidth;
    }

    /**
     * 设置 block 的目标颜色（JSON 图案颜色）
     */
    setTargetColor(r: number, g: number, b: number, a: number): void {
        this._targetColorR = r;
        this._targetColorG = g;
        this._targetColorB = b;
        this._targetColorA = a;
    }

    /**
     * 设置 block 的当前颜色（circle 放置后的颜色）
     */
    setCurrentColor(r: number, g: number, b: number, a: number): void {
        this._currentColorR = r;
        this._currentColorG = g;
        this._currentColorB = b;
        this._currentColorA = a;
    }

    // 目标颜色属性
    get targetColorR(): number { return this._targetColorR; }
    get targetColorG(): number { return this._targetColorG; }
    get targetColorB(): number { return this._targetColorB; }
    get targetColorA(): number { return this._targetColorA; }

    // 当前颜色属性
    get currentColorR(): number { return this._currentColorR; }
    get currentColorG(): number { return this._currentColorG; }
    get currentColorB(): number { return this._currentColorB; }
    get currentColorA(): number { return this._currentColorA; }

    // Block 状态
    get state(): BlockState { return this._state; }
    set state(value: BlockState) { this._state = value; }

    onLoad() {
        // 注册触摸结束事件
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 设置 block 为已熨烫状态
     */
    public setIroned(): void {
        this._state = BlockState.IRONED;
    }

    /**
     * 检查是否可以熨烫（只有 HAS_CIRCLE 状态可以熨烫）
     */
    public canIron(): boolean {
        //console.log('_row:', this._row, ' _col:', this._col, ' _state:', this._state);
        return this._state === BlockState.HAS_CIRCLE;
    }

    private onTouchEnd(): void {
        // 计算在 JSON 中的位置（索引）
        const jsonIndex = this._row * this._gridWidth + this._col;
        console.log(`点击了 block: 行=${this._row}, 列=${this._col}, 目标颜色=(r:${this._targetColorR}, g:${this._targetColorG}, b:${this._targetColorB}, a:${this._targetColorA}), 当前颜色=(r:${this._currentColorR}, g:${this._currentColorG}, b:${this._currentColorB}, a:${this._currentColorA}), JSON索引=${jsonIndex + 6}`);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}
