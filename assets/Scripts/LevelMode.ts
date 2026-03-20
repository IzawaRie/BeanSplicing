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
    private targetScore: number = 0;
    private currentScore: number = 0;
    private maxMoves: number = 0;
    private usedMoves: number = 0;

    get modeType(): GameModeType { return GameModeType.LEVEL; }

    onLoad() {
        if (this.node) {
            this.setGridDrawer(this.node.parent?.getComponent(GridDrawer) || null);
        }
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelId: number, moves: number, target: number): void {
        this.currentLevel = levelId;
        this.maxMoves = moves;
        this.targetScore = target;
        this.currentScore = 0;
        this.usedMoves = 0;
        this.startGame();
        console.log(`闯关模式: 关卡 ${levelId}, 目标 ${target}, 步数 ${moves}`);
    }

    /**
     * 使用一步（熨烫一次算一步）
     */
    useMove(): boolean {
        if (!this._isPlaying || this.usedMoves >= this.maxMoves) {
            return false;
        }
        this.usedMoves++;
        console.log(`步数: ${this.usedMoves}/${this.maxMoves}`);
        this.onScoreChange?.(this.currentScore);
        this.checkComplete();
        return true;
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
        this.usedMoves = 0;
        this._isPlaying = false;
    }

    checkComplete(): boolean {
        if (!this._isPlaying) return false;

        // 目标达成
        if (this.currentScore >= this.targetScore) {
            this.endGame({
                success: true,
                score: this.currentScore,
                message: `通关成功！得分: ${this.currentScore}`
            });
            return true;
        }

        // 步数用尽且未达成目标
        if (this.usedMoves >= this.maxMoves && this.currentScore < this.targetScore) {
            this.endGame({
                success: false,
                score: this.currentScore,
                message: `挑战失败！得分: ${this.currentScore}`
            });
            return true;
        }

        return false;
    }

    getProgress(): number {
        return this.targetScore > 0 ? Math.min(1, this.currentScore / this.targetScore) : 0;
    }

    // Getters
    getCurrentScore(): number { return this.currentScore; }
    getUsedMoves(): number { return this.usedMoves; }
    getMaxMoves(): number { return this.maxMoves; }
    getTargetScore(): number { return this.targetScore; }
    getCurrentLevel(): number { return this.currentLevel; }
}
