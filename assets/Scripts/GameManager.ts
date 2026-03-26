import { _decorator, Component, Node } from 'cc';
import { GameMode, GameModeType} from './GameMode';
import { LevelMode } from './LevelMode';
import { MenuManager } from './MenuManager';
import { ProgressController } from './ProgressController';
import { LevelConfig } from './LevelConfig';
import { SettingController } from './SettingController';
import { WXManager } from './WXManager';
const { ccclass, property } = _decorator;

/**
 * 游戏状态枚举
 */
export enum GameState {
    WAITING = 0,    // 主页面等待中
    PLAYING = 1,    // 游戏进行中
    PAUSED = 2,     // 暂停中
    GAME_OVER = 3   // 游戏结束
}

/**
 * 游戏管理器
 * 负责游戏全局状态管理和多模式支持
 */
@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    @property({ type: MenuManager })
    menuManager: MenuManager = null;

    @property({ type: ProgressController })
    progress: ProgressController = null;

    @property({ type: SettingController})
    setting: SettingController = null;

    @property({ type: WXManager })
    wxManager: WXManager = null;

    // 闯关模式组件
    @property({ type: LevelMode })
    levelMode: LevelMode = null;

    // 游戏状态
    private _gameState: GameState = GameState.WAITING;
    
    // 当前游戏模式
    private currentMode: GameMode = null;
    private _currentModeType: GameModeType = GameModeType.LEVEL;

    // 当前关卡数
    private _currentLevel: number = 1;

    public hand_setting = 1; //-1:左手  1:右手

    async onLoad() {
        // 单例模式
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;

        this._currentLevel = await this.wxManager.getStorageLevel() ?? 1;
        this.menuManager.updateLevelButtonText(this._currentLevel);
        //this.loadSavedLevel();
    }

    start() {
        this.levelMode.patternApplier.gridDrawer = this.levelMode.gridDrawer;
        this.levelMode.circleList.setAllNodes();
    }

    /**
     * 从云端加载保存的关卡数
     */
    // private async loadSavedLevel(): Promise<void> {
    //     if (!this.cloudStorage) return;

    //     const savedLevel = await this.cloudStorage.getLevel();
    //     if (savedLevel !== null && savedLevel > 0 && this._currentLevel != savedLevel) {
    //         this.cloudStorage.setStorageLevel(savedLevel);
    //         this._currentLevel = savedLevel;
    //         LevelConfig.getInstance().setCurrentLevelIndex(savedLevel - 1);
    //         this.levelMode.updateMenuLevelButton();
    //     }
    // }

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

    // ==================== 当前关卡 ====================

    /**
     * 获取当前关卡数
     */
    public get currentLevel(): number {
        return this._currentLevel;
    }

    /**
     * 设置当前关卡数
     */
    public set currentLevel(value: number) {
        this._currentLevel = value;
        LevelConfig.getInstance().setCurrentLevelIndex(value - 1);
        // 通知 LevelMode 更新按钮文字
        this.levelMode.updateMenuLevelButton();
        //this.cloudStorage.submitLevel(value);
        this.wxManager.setStorageLevel(value);
    }

    // ==================== 游戏模式 ====================

    /**
     * 获取当前模式类型
     */
    public get currentModeType(): GameModeType {
        return this._currentModeType;
    }

    /**
     * 切换游戏模式
     */
    public switchMode(modeType: GameModeType): void {
        this._currentModeType = modeType;

        switch (modeType) {
            case GameModeType.LEVEL:
                this.currentMode = this.levelMode;
                break;
        }

        console.log(`切换到游戏模式: ${modeType}`);
    }

    /**
     * 获取当前模式
     */
    public getCurrentMode(): GameMode | null {
        return this.currentMode;
    }

    /**
     * 开始闯关模式
     */
    public startLevelMode(levelId: number): void {
        this.switchMode(GameModeType.LEVEL);
        if (this.levelMode) {
            this.levelMode.startLevel(levelId);
            this.levelMode.startGame();
        }
    }

    // ==================== 游戏状态 ====================

    /**
     * 获取游戏状态
     */
    public get gameState(): GameState {
        return this._gameState;
    }

    /**
     * 设置游戏状态
     */
    public set gameState(value: GameState) {
        this._gameState = value;
    }
}
