import { _decorator, Component, Node } from 'cc';
import { GameMode, GameModeType} from './GameMode';
import { LevelMode } from './LevelMode';
import { MenuManager } from './MenuManager';
import { ProgressController } from './ProgressController';
import { LevelConfig } from './LevelConfig';
import { SettingController } from './SettingController';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
import { WindowController } from './WindowController';
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
 * 难度模式枚举
 */
export enum DifficultyMode {
    SIMPLE = 'simple',
    MEDIUM = 'medium',
    HARD = 'hard'
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

    @property({ type: AudioManager })
    audioManager: AudioManager = null;

    @property({ type: LevelMode })
    levelMode: LevelMode = null;

    @property({ type: WindowController })
    window: WindowController = null;

    // 游戏状态
    private _gameState: GameState = GameState.WAITING;

    // 当前游戏模式
    private currentMode: GameMode = null;
    private _currentModeType: GameModeType = GameModeType.LEVEL;

    // 当前难度模式
    private _currentDifficulty: DifficultyMode = DifficultyMode.SIMPLE;

    // 三种难度的独立关卡数
    private _simpleLevel: number = 1;
    private _mediumLevel: number = 1;
    private _hardLevel: number = 1;

    public isShake: boolean = true;
    public hand_setting = 1; //-1:左手  1:右手

    // 窗口是否打开
    public isWindowOpen: boolean = false;

    // 体力值
    private _power: number = 10;

    // 体力恢复间隔（30分钟，毫秒）
    private readonly POWER_REGEN_INTERVAL: number = 30 * 60 * 1000;
    // 每次恢复体力值
    private readonly POWER_REGEN_AMOUNT: number = 3;
    // 体力上限
    private readonly POWER_MAX: number = 10;
    // 下次恢复时间（时间戳，毫秒）
    private _powerNextRegenTime: number = 0;

    public get power(): number {
        return this._power;
    }

    public set power(value: number) {
        const oldPower = this._power;
        this._power = value;
        this.wxManager.setPower(value);
        // 同步更新 UI
        if (this.menuManager?.power_label) {
            this.menuManager.power_label.string = `${value}`;
        }
        // 当体力减少且小于上限时，设置下次恢复时间
        if (oldPower > value && value < this.POWER_MAX && this._powerNextRegenTime <= 0) {
            this._powerNextRegenTime = Date.now() + this.POWER_REGEN_INTERVAL;
            this.wxManager.setPowerNextRegenTime(this._powerNextRegenTime);
        }
    }

    /**
     * 每帧更新体力恢复逻辑
     */
    public updatePowerRegen(): void {
        if (this._power >= this.POWER_MAX) {
            this._powerNextRegenTime = 0;
            return;
        }
        if (this._powerNextRegenTime <= 0) return;

        const now = Date.now();
        if (now >= this._powerNextRegenTime) {
            // 恢复体力
            this._power = Math.min(this._power + this.POWER_REGEN_AMOUNT, this.POWER_MAX);
            this.wxManager.setPower(this._power);
            this.wxManager.setPowerNextRegenTime(0);
            this._powerNextRegenTime = 0;
        }
    }

    /**
     * 获取体力下次恢复剩余时间（毫秒），未在恢复中返回 0
     */
    public getPowerRegenRemaining(): number {
        if (this._power >= this.POWER_MAX || this._powerNextRegenTime <= 0) return 0;
        return Math.max(0, this._powerNextRegenTime - Date.now());
    }

    update(_deltaTime: number): void {
        this.updatePowerRegen();
    }

    /**
     * 检查是否有窗口阻挡按钮点击
     */
    public isWindowBlocking(): boolean {
        return this.isWindowOpen || (this.setting?.node?.active ?? false) || (this.window?.node?.active ?? false);
    }

    onLoad() {
        // 单例模式
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;

        this.initStorage();
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
     * 获取当前难度模式
     */
    public get currentDifficulty(): DifficultyMode {
        return this._currentDifficulty;
    }

    /**
     * 设置当前难度模式
     */
    public set currentDifficulty(value: DifficultyMode) {
        this._currentDifficulty = value;
    }

    /**
     * 获取当前难度对应的关卡数
     */
    public get currentLevel(): number {
        switch (this._currentDifficulty) {
            case DifficultyMode.SIMPLE: return this._simpleLevel;
            case DifficultyMode.MEDIUM: return this._mediumLevel;
            case DifficultyMode.HARD:   return this._hardLevel;
        }
    }

    /**
     * 设置当前难度对应的关卡数
     */
    public set currentLevel(value: number) {
        switch (this._currentDifficulty) {
            case DifficultyMode.SIMPLE:
                this._simpleLevel = value;
                this.wxManager.setStorageLevelByDifficulty(DifficultyMode.SIMPLE, value);
                break;
            case DifficultyMode.MEDIUM:
                this._mediumLevel = value;
                this.wxManager.setStorageLevelByDifficulty(DifficultyMode.MEDIUM, value);
                break;
            case DifficultyMode.HARD:
                this._hardLevel = value;
                this.wxManager.setStorageLevelByDifficulty(DifficultyMode.HARD, value);
                break;
        }
        LevelConfig.getInstance().setCurrentLevelIndex(value - 1);
        this.levelMode.updateMenuLevelButton(this._currentDifficulty);
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

    public vibrateShort(type: 'heavy' | 'medium' | 'light' = 'medium'){
        if(!this.isShake) return;
        this.wxManager.vibrateShort(type);
    }

    private async initStorage(){
        // 加载三种难度的关卡数
        this._simpleLevel = await this.wxManager.getStorageLevelByDifficulty(DifficultyMode.SIMPLE) ?? 1;
        this._mediumLevel = await this.wxManager.getStorageLevelByDifficulty(DifficultyMode.MEDIUM) ?? 1;
        this._hardLevel   = await this.wxManager.getStorageLevelByDifficulty(DifficultyMode.HARD)   ?? 1;

        const shake = await this.wxManager.getShake();
        if(shake == null){
            this.isShake = true;
        }else{
            this.isShake = shake == 1 ? true : false;
        }
        this.setting.shake_toggle.isChecked = this.isShake;

        const handSetting = await this.wxManager.getHandSetting();
        if(handSetting != null){
            this.hand_setting = handSetting;
            if (handSetting === -1) {
                this.setting.hand_toggle_left.isChecked = true;
            } else {
                this.setting.hand_toggle_right.isChecked = true;
            }
        }

        // 加载音乐开关设置
        const music = await this.wxManager.getMusic();
        const isMusicOn = music == null ? true : (music == 1);
        this.audioManager.setMusicEnabled(isMusicOn);
        this.setting.music_toggle.isChecked = isMusicOn;

        // 加载音效开关设置
        const audio = await this.wxManager.getAudio();
        const isAudioOn = audio == null ? true : (audio == 1);
        this.audioManager.setAudioEnabled(isAudioOn);
        this.setting.audio_toggle.isChecked = isAudioOn;

        // 加载体力值
        const savedPower = await this.wxManager.getPower();
        const savedNextRegen = await this.wxManager.getPowerNextRegenTime();
        if (savedPower != null) {
            this._power = savedPower;
            this._powerNextRegenTime = savedNextRegen ?? 0;
            // 检查离线期间是否有需要恢复的体力
            if (this._power < this.POWER_MAX && this._powerNextRegenTime > 0) {
                const now = Date.now();
                if (now >= this._powerNextRegenTime) {
                    // 计算离线期间累积了多少次恢复
                    const elapsed = now - this._powerNextRegenTime;
                    const regenCount = Math.floor(elapsed / this.POWER_REGEN_INTERVAL) + 1;
                    this._power = Math.min(this._power + regenCount * this.POWER_REGEN_AMOUNT, this.POWER_MAX);
                    this.wxManager.setPower(this._power);
                    // 重置下次恢复时间
                    if (this._power >= this.POWER_MAX) {
                        this._powerNextRegenTime = 0;
                        this.wxManager.setPowerNextRegenTime(0);
                    } else {
                        this._powerNextRegenTime = now + this.POWER_REGEN_INTERVAL;
                        this.wxManager.setPowerNextRegenTime(this._powerNextRegenTime);
                    }
                }
            }
            // 更新 UI
            if (this.menuManager?.power_label) {
                this.menuManager.power_label.string = `${this._power}`;
            }
        } else {
            // 没有存档，默认10
            this.power = 10;
        }
    }
}
