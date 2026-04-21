import { _decorator, Color, Component, Node, Sprite } from 'cc';
const { ccclass } = _decorator;

/**
 * Block 状态枚举
 */
export enum BlockState {
    NO_CIRCLE = 0,    // 无 circle
    HAS_CIRCLE = 1,  // 有 circle（未熨烫）
    IRONING = 2,     // 熨烫中（半透明）
    IRONED = 3       // 已熨烫
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
    private _currentColorR: number = -1;
    private _currentColorG: number = -1;
    private _currentColorB: number = -1;
    private _currentColorA: number = -1;

    // Block 状态
    private _state: BlockState = BlockState.NO_CIRCLE;
    private _ironOpacityStage: number = 0;
    private _hasTriedHighlightCoinSpawn: boolean = false;
    private _hasTriedIronCoinSpawn: boolean = false;

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
    get ironOpacityStage(): number { return this._ironOpacityStage; }
    get hasTriedHighlightCoinSpawn(): boolean { return this._hasTriedHighlightCoinSpawn; }
    get hasTriedIronCoinSpawn(): boolean { return this._hasTriedIronCoinSpawn; }

    /**
     * 标记当前 block 已尝试触发高亮金币。
     * 无论概率是否命中，只要尝试过就不会再重复触发。
     */
    public markHighlightCoinSpawnAttempt(): boolean {
        if (this._hasTriedHighlightCoinSpawn) {
            return false;
        }

        this._hasTriedHighlightCoinSpawn = true;
        return true;
    }

    /**
     * 标记当前 block 已尝试触发熨烫金币。
     * 无论概率是否命中，只要尝试过就不会再重复触发。
     */
    public markIronCoinSpawnAttempt(): boolean {
        if (this._hasTriedIronCoinSpawn) {
            return false;
        }

        this._hasTriedIronCoinSpawn = true;
        return true;
    }

    /**
     * 新一局开始时重置金币触发尝试状态。
     */
    public resetCoinSpawnAttempts(): void {
        this._hasTriedHighlightCoinSpawn = false;
        this._hasTriedIronCoinSpawn = false;
    }

    onLoad() {
        // 注册触摸结束事件
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 设置 block 为已熨烫状态
     */
    public setIroned(): void {
        this._ironOpacityStage = 3;
        this._state = BlockState.IRONED;
    }

    public resetIroningProgress(): void {
        this._ironOpacityStage = 0;
        if (this._state === BlockState.IRONING || this._state === BlockState.IRONED) {
            this._state = BlockState.HAS_CIRCLE;
        }
    }

    public advanceIroningStage(): number {
        if (!this.canIron()) {
            return this._ironOpacityStage;
        }

        if (this.isNearWhiteColor()) {
            this._ironOpacityStage = 3;
            this._state = BlockState.IRONED;
            return this._ironOpacityStage;
        }

        this._ironOpacityStage = Math.min(3, this._ironOpacityStage + 1);
        this._state = this._ironOpacityStage >= 3 ? BlockState.IRONED : BlockState.IRONING;
        return this._ironOpacityStage;
    }

    private isNearWhiteColor(): boolean {
        const colorR = this._currentColorR >= 0 ? this._currentColorR : this._targetColorR;
        const colorG = this._currentColorG >= 0 ? this._currentColorG : this._targetColorG;
        const colorB = this._currentColorB >= 0 ? this._currentColorB : this._targetColorB;

        return colorR > 225 && colorG > 225 && colorB > 225;
    }

    public getIronOpacityRatio(): number {
        if (this._ironOpacityStage > 0 && this.isNearWhiteColor()) {
            return 1;
        }

        switch (this._ironOpacityStage) {
            case 1: return 0.3;
            case 2: return 0.6;
            case 3: return 1;
            default: return 0;
        }
    }

    public getIronOpacity255(): number {
        return Math.round(this.getIronOpacityRatio() * 255);
    }

    /**
     * 重置 block 到初始状态（无 circle）
     * 用于 fix_skill 修复错误的 block
     */
    public resetBlock(): void {
        this._state = BlockState.NO_CIRCLE;
        this._ironOpacityStage = 0;
        this._currentColorR = -1;
        this._currentColorG = -1;
        this._currentColorB = -1;
        this._currentColorA = -1;

        const blockSp = this.node.getChildByName('block_sp');
        const sprite = blockSp?.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(
                this.targetColorR,
                this.targetColorG,
                this.targetColorB,
                this.targetColorA
            );
            sprite.enabled = true;
        }
    }

    /**
     * 检查当前颜色是否与目标颜色匹配
     */
    public isColorMatch(): boolean {
        return this._currentColorR === this._targetColorR &&
               this._currentColorG === this._targetColorG &&
               this._currentColorB === this._targetColorB &&
               this._currentColorA === this._targetColorA;
    }

    /**
     * 检查是否可以熨烫（只有 HAS_CIRCLE 状态可以熨烫）
     */
    public canIron(): boolean {
        //console.log('_row:', this._row, ' _col:', this._col, ' _state:', this._state);
        return this._state === BlockState.HAS_CIRCLE || this._state === BlockState.IRONING;
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
