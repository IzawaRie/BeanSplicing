import { _decorator, Component, Node } from 'cc';
import { GameMode, GameModeType, GameResult } from './GameMode';
import { GridDrawer } from './GridDrawer';

const { ccclass, property } = _decorator;

/**
 * 闯关模式
 * 按顺序通关，有步数限制和目标分数
 */
@ccclass('LevelMode')
export class LevelMode extends GameMode {
    static readonly MODE_TYPE = GameModeType.LEVEL;

    @property(Node)
    nextLevelBtn: Node | null = null;

    @property(Node)
    restartBtn: Node | null = null;

    private currentLevel: number = 1;
    private currentScore: number = 0;
    private _patternPath: string = '';

    get modeType(): GameModeType { return GameModeType.LEVEL; }

    onLoad() {
        if (this.node) {
            this.setGridDrawer(this.node.parent?.getComponent(GridDrawer) || null);
        }
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelId: number, patternPath: string = ''): void {
        this.currentLevel = levelId;
        this.currentScore = 0;
        this._patternPath = patternPath;
        this.startGame();
        console.log(`闯关模式: 关卡 ${levelId}, 图案: ${patternPath}`);
    }

    /**
     * 获取当前关卡的图案路径
     */
    get patternPath(): string {
        return this._patternPath;
    }

    /**
     * 添加分数
     */
    addScore(points: number): void {
        this.currentScore += points;
        this.onScoreChange?.(this.currentScore);
        this.checkComplete();
    }

    reset(): void {
        this.currentScore = 0;
        this._isPlaying = false;
    }

    checkComplete(): boolean {
        if (!this._isPlaying) return false;

    }


    // Getters
    getCurrentScore(): number { return this.currentScore; }
    getCurrentLevel(): number { return this.currentLevel; }
}
