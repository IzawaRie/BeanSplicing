import { _decorator, Component, Node } from 'cc';
const { ccclass } = _decorator;

@ccclass('BlockController')
export class BlockController extends Component {
    private _row: number = 0;
    private _col: number = 0;
    private _gridWidth: number = 0;
    private _colorR: number = 0;
    private _colorG: number = 0;
    private _colorB: number = 0;
    private _colorA: number = 0;

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

    onLoad() {
        // 注册触摸结束事件
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
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
