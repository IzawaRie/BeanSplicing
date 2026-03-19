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
    private _colorR: number = 0;
    private _colorG: number = 0;
    private _colorB: number = 0;
    private _colorA: number = 0;

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
     * 设置 block 的颜色
     */
    setColor(r: number, g: number, b: number, a: number): void {
        this._colorR = r;
        this._colorG = g;
        this._colorB = b;
        this._colorA = a;
    }

    // 公开的颜色属性，供外部读取
    get colorR(): number { return this._colorR; }
    get colorG(): number { return this._colorG; }
    get colorB(): number { return this._colorB; }
    get colorA(): number { return this._colorA; }

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
        console.log(`点击了 block: 行=${this._row}, 列=${this._col}, 颜色=(r:${this._colorR}, g:${this._colorG}, b:${this._colorB}, a:${this._colorA}), JSON索引=${jsonIndex + 6}`);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}
