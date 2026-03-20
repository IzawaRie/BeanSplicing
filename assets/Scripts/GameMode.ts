import { _decorator, Component } from 'cc';
import { GridDrawer } from './GridDrawer';

const { ccclass } = _decorator;

/**
 * 游戏模式类型枚举
 */
export enum GameModeType {
    LEVEL = 'level',       // 闯关模式
    CHALLENGE = 'challenge', // 挑战模式
    FREE = 'free',         // 自由模式
    ZEN = 'zen'            // 禅模式
}

/**
 * 游戏模式结果
 */
export interface GameResult {
    success: boolean;
    score?: number;
    time?: number;
    message?: string;
}

/**
 * 游戏模式基类
 * 定义所有模式共有的接口
 */
export abstract class GameMode extends Component {
    // 模式类型
    abstract get modeType(): GameModeType;

    // 是否正在游戏中
    protected _isPlaying: boolean = false;
    public get isPlaying(): boolean { return this._isPlaying; }

    // 网格绘制器
    protected gridDrawer: GridDrawer | null = null;

    // 回调函数
    public onGameStart?: () => void;
    public onGameUpdate?: (progress: number) => void;
    public onGameEnd?: (result: GameResult) => void;
    public onScoreChange?: (score: number) => void;

    setGridDrawer(drawer: GridDrawer): void {
        this.gridDrawer = drawer;
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        this._isPlaying = true;
        this.onGameStart?.();
    }

    /**
     * 结束游戏
     */
    public endGame(result: GameResult): void {
        this._isPlaying = false;
        this.onGameEnd?.(result);
    }

    /**
     * 重置游戏
     */
    public abstract reset(): void;

    /**
     * 检查游戏是否完成（每个模式实现自己的完成条件）
     */
    public abstract checkComplete(): boolean;
}