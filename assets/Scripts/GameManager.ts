import { _decorator, Component, Node } from 'cc';
import { GridDrawer } from './GridDrawer';
import { PixelPatternApplier } from './PixelPatternApplier';
import { PaletteGenerator } from './PaletteGenerator';
import { CircleListController } from './CircleListController';
const { ccclass, property } = _decorator;

/**
 * 游戏管理器
 * 负责游戏全局状态管理
 */
@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    @property({ type: GridDrawer })
    gridDrawer: GridDrawer = null;

    @property({ type: PixelPatternApplier })
    patternApplier: PixelPatternApplier = null;

    @property({ type: PaletteGenerator })
    paletteGenerator: PaletteGenerator = null;

    @property({ type: CircleListController })
    circleList: CircleListController = null;

    @property({ type: String })
    patternPath: string = 'pixel_patterns/apple';

    // 当前选中的颜色序号
    private _selectedColorIndex: number = 1;

    // 游戏状态
    private _isGameActive: boolean = false;

    // 颜色列表 [{ r, g, b, a }]
    private _colorList: { r: number; g: number; b: number; a: number }[] = [];

    onLoad() {
        // 单例模式
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;
    }

    start() {
        // 设置回调，在 blocks 创建完成后应用图案
        if (this.gridDrawer) {
            const gridDrawer = this.gridDrawer;
            if (gridDrawer) {
                gridDrawer.onBlocksCreated = () => {
                    console.log('Blocks 创建完成，开始应用图案');

                    // 延迟一点执行，确保 blocks 完全就绪
                    this.scheduleOnce(() => {
                        this.applyPattern();
                        this.applyRefer();
                    }, 0.2);
                };
            }
        }
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): GameManager | null {
        return GameManager._instance;
    }

    /**
     * 应用图案
     */
    private applyPattern() {
        if (this.patternApplier) {
            this.patternApplier.applyFromJson(this.patternPath);
        } else {
            console.error('未设置 PixelPatternApplier');
        }
    }

    private applyRefer(){
        if (this.paletteGenerator) {
            this.paletteGenerator.loadFromJson(this.patternPath);
        } else {
            console.error('未设置 PaletteGenerator');
        }
    }

    // ==================== 颜色选择 ====================

    /**
     * 获取当前选中的颜色序号
     */
    public get selectedColorIndex(): number {
        return this._selectedColorIndex;
    }

    /**
     * 设置当前选中的颜色序号
     */
    public set selectedColorIndex(value: number) {
        this._selectedColorIndex = value;
    }

    // ==================== 游戏状态 ====================

    /**
     * 游戏是否进行中
     */
    public get isGameActive(): boolean {
        return this._isGameActive;
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        this._isGameActive = true;
        this._selectedColorIndex = 1;
    }

    /**
     * 结束游戏
     */
    public endGame(): void {
        this._isGameActive = false;
    }

    /**
     * 重置游戏
     */
    public resetGame(): void {
        this._isGameActive = false;
        this._selectedColorIndex = 1;
    }

    // ==================== 颜色列表 ====================

    /**
     * 获取颜色列表
     */
    public getColorList(): { r: number; g: number; b: number; a: number }[] {
        return this._colorList;
    }

    /**
     * 设置颜色列表
     */
    public setColorList(colors: { r: number; g: number; b: number; a: number }[]): void {
        this._colorList = colors;
        // 通知 CircleListController 更新
        if (this.circleList) {
            this.circleList.updateColorList(colors);
        }
    }
}
