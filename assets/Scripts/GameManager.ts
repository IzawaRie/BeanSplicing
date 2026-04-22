import { _decorator, Component, Node } from 'cc';
import { PatternBundle } from './PatternBundle';
import { GameMode, GameModeType} from './GameMode';
import { LevelMode } from './LevelMode';
import { MenuManager } from './MenuManager';
import { ProgressController } from './ProgressController';
import { LevelConfig } from './LevelConfig';
import { SettingController } from './SettingController';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
import { WindowController } from './WindowController';
import { PlayerService } from './PlayerService';
import { ChartController } from './ChartController';
import { SubscribeController } from './SubscribeController';
import { ShopController } from './ShopController';
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

    @property({ type: ChartController })
    chart: ChartController = null;
    
    @property({ type: WindowController })
    window: WindowController = null;

    @property({ type: SubscribeController })
    subscribe: SubscribeController = null;

    @property({ type: ShopController })
    shop: ShopController = null;

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

    // 用户 openid
    private _openid: string | null = null;
    public get openid(): string | null {
        return this._openid;
    }
    public setOpenid(openid: string | null): void {
        this._openid = openid;
    }

    public get canOpenChartDirectly(): boolean {
        return this.hasReadyChartProfile();
    }

    public get coinCount(): number {
        return this._coinCount;
    }

    public set coinCount(value: number) {
        this._coinCount = Math.max(0, Math.floor(value));
        if (this.menuManager?.coin_label) {
            this.menuManager.coin_label.string = `${this._coinCount}`;
        }
        if (this.shop?.coin_label) {
            this.shop.coin_label.string = `${this._coinCount}`;
        }
        this.scheduleCoinSave();
    }

    public addCoins(amount: number = 1): void {
        if (amount <= 0) {
            return;
        }

        this.coinCount = this._coinCount + amount;
    }

    private scheduleCoinSave(): void {
        this._coinCacheDirty = true;
        if (!this._storageLoaded) {
            return;
        }

        if (this._coinSaveScheduled) {
            return;
        }

        this._coinSaveScheduled = true;
        this.scheduleOnce(() => {
            this._coinSaveScheduled = false;
            if (!this._coinCacheDirty) {
                return;
            }

            this._coinCacheDirty = false;
            this.wxManager?.setCoins(this._coinCount);
        }, this.COIN_SAVE_DELAY_SECONDS);
    }

    /**
     * 判断当前是否已经具备可直接用于排行榜展示的真实用户资料
     */
    public hasReadyChartProfile(): boolean {
        return !!this.wxManager?.hasRealUserProfile();
    }

    /**
     * 打开排行榜前，按需补齐当前玩家的真实昵称和头像
     */
    public async ensureChartProfileReady(): Promise<void> {
        if (!this.wxManager) {
            return;
        }

        if (this.hasReadyChartProfile()) {
            return;
        }

        if (!this._openid) {
            const openid = await this.wxManager.getOpenId();
            if (openid) {
                this.setOpenid(openid);
            }
        }

        if (!this._openid) {
            return;
        }

        const hasUserInfoPermission = await this.wxManager.hasUserInfoPermission();
        if (!hasUserInfoPermission) {
            return;
        }

        try {
            const userInfo = await this.wxManager.getUserInfo();
            if (!this.wxManager.hasRealUserProfile()) {
                return;
            }

            await PlayerService.instance?.syncAuthorizedProfile(userInfo?.nickname, userInfo?.avatarUrl);
        } catch (error) {
            console.warn('GameManager: failed to ensure chart profile before opening chart', error);
        }
    }

    // 存储是否加载完成
    private _storageLoaded: boolean = false;
    public get storageLoaded(): boolean {
        return this._storageLoaded;
    }

    // 关卡配置是否加载完成
    private _levelConfigLoaded: boolean = false;

    // 能量
    private _power: number = 10;
    private _coinCount: number = 0;
    private _coinCacheDirty: boolean = false;
    private _coinSaveScheduled: boolean = false;
    private readonly COIN_SAVE_DELAY_SECONDS: number = 5;

    // 体力恢复间隔（30分钟，毫秒）
    private readonly POWER_REGEN_INTERVAL: number = 30 * 60 * 1000;
    // 每次恢复能量
    private readonly POWER_REGEN_AMOUNT: number = 1;
    // 体力上限
    private readonly POWER_MAX: number = 10;
    // 下次恢复时间（时间戳，毫秒）
    private _powerNextRegenTime: number = 0;

    public get power(): number {
        return this._power;
    }

    public set power(value: number) {
        this._power = value;
        this.wxManager.setPower(value);
        // 同步更新 UI
        if (this.menuManager?.power_label) {
            this.menuManager.power_label.string = `${value}`;
        }
        // 体力满了，清除倒计时
        if (value >= this.POWER_MAX) {
            this._powerNextRegenTime = 0;
            this.wxManager.setPowerNextRegenTime(0);
            return;
        }
        // 体力不足时，如果还没有倒计时，启动新的倒计时
        if (this._powerNextRegenTime <= 0) {
            this._powerNextRegenTime = Date.now() + this.POWER_REGEN_INTERVAL;
            this.wxManager.setPowerNextRegenTime(this._powerNextRegenTime);
        }

        void this.wxManager?.createPowerRegenSubscribeTaskIfAccepted('game_manager_power_setter');
    }

    /**
     * 每帧更新体力恢复逻辑（仅在存储加载完成后调用）
     */
    public updatePowerRegen(): void {
        if (!this._storageLoaded) return;
        if (this._powerNextRegenTime <= 0) return;
        if (this._power >= this.POWER_MAX) {
            this._powerNextRegenTime = 0;
            this.wxManager.setPowerNextRegenTime(0);
            return;
        }

        const now = Date.now();
        if (now >= this._powerNextRegenTime) {
            // 倒计时到期，恢复体力并设置下一轮倒计时
            this.power = Math.min(this._power + this.POWER_REGEN_AMOUNT, this.POWER_MAX);
            if (this._power >= this.POWER_MAX) {
                this._powerNextRegenTime = 0;
                this.wxManager.setPowerNextRegenTime(0);
            } else {
                this._powerNextRegenTime = now + this.POWER_REGEN_INTERVAL;
                this.wxManager.setPowerNextRegenTime(this._powerNextRegenTime);
            }
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
        if (this._storageLoaded) {
            this.updatePowerRegen();
        }
    }

    /**
     * 检查是否有窗口阻挡按钮点击
     */
    public isWindowBlocking(): boolean {
        return this.isWindowOpen ||
               (this.setting?.node?.active ?? false) ||
               (this.window?.node?.active ?? false) ||
               (this.chart?.node?.active ?? false) ||
               (this.subscribe?.node?.active ?? false) ||
               (this.subscribe?.node?.parent?.active ?? false);
    }

    onLoad() {
        // 单例模式
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;

        // 获取用户 openid；如果用户已授权用户信息，再拉取用户信息，否则直接同步云数据
        this.wxManager.getOpenId().then(async (openid) => {
            this.setOpenid(openid);
            console.log('GameManager openid:', this._openid);

            await this.ensureChartProfileReady();
            PlayerService.instance?.syncProgressWithCloud();
            PlayerService.instance?.updateLastLoginTime();
            this.scheduleOnce(() => {
                void this.chart?.preloadAllRankings();
            }, 0);
        });

        this.menuManager.levelConfig = LevelConfig.getInstance();
        PatternBundle.getInstance().loadBundle();
        void this.initStorage().then(async () => {
            if (!this.wxManager) {
                return;
            }

            const subscribeState = await this.wxManager.getSubscribeTemplateAuthorizeState();
            if (this.menuManager?.sub_btn) {
                this.menuManager.sub_btn.active = subscribeState === 'unset';
            }
        });
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
        this._coinCount = Math.max(0, Math.floor((await this.wxManager.getCoins()) ?? 0));
        if (this.menuManager?.coin_label) {
            this.menuManager.coin_label.string = `${this._coinCount}`;
        }
        if (this.shop?.coin_label) {
            this.shop.coin_label.string = `${this._coinCount}`;
        }
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

        // 加载能量
        const savedPower = await this.wxManager.getPower();
        const savedNextRegen = await this.wxManager.getPowerNextRegenTime();
        if (savedPower != null) {
            this._power = savedPower;
            const now = Date.now();
            // 有待恢复的倒计时
            if (this._power < this.POWER_MAX && savedNextRegen != null && savedNextRegen > 0) {
                if (now >= savedNextRegen) {
                    // 离线过去了多少毫秒（从 savedNextRegen 算起，>= 0）
                    const elapsed = now - savedNextRegen;
                    const regenCount = elapsed < this.POWER_REGEN_INTERVAL ? 1 : Math.floor(elapsed / this.POWER_REGEN_INTERVAL);
                    // 离线恢复
                    this._power = Math.min(this._power + regenCount * this.POWER_REGEN_AMOUNT, this.POWER_MAX);
                    // 下一轮倒计时：距下一个 interval 到期还剩多少时间
                    const passed = elapsed % this.POWER_REGEN_INTERVAL;
                    if (this._power >= this.POWER_MAX) {
                        this._powerNextRegenTime = 0;
                    } else {
                        this._powerNextRegenTime = now + (this.POWER_REGEN_INTERVAL - passed);
                    }
                    this.wxManager.setPowerNextRegenTime(this._powerNextRegenTime);
                    // 通过 setter 保存更新后的体力值到 storage
                    this.wxManager.setPower(this._power);
                } else {
                    // 倒计时未过期，使用保存的倒计时
                    this._powerNextRegenTime = savedNextRegen;
                }
            } else {
                // 无待恢复的倒计时（满体力或没有保存倒计时）
                if (this._power < this.POWER_MAX) {
                    // 开始新的 30 分钟倒计时
                    this._powerNextRegenTime = now + this.POWER_REGEN_INTERVAL;
                    this.wxManager.setPowerNextRegenTime(this._powerNextRegenTime);
                } else {
                    this._powerNextRegenTime = 0;
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

        // 等待关卡配置加载完成
        await new Promise<void>((resolve) => {
            LevelConfig.getInstance().loadConfig(() => {
                this._levelConfigLoaded = true;
                resolve();
            });
        });

        this._storageLoaded = true;

        this.checkNewbieGuide();
    }

    /**
     * 新手引导检查：未通过第一关则进入新手教程
     */
    private checkNewbieGuide(): void {
        // 更新所有难度按钮文字
        const allDiffs = [DifficultyMode.SIMPLE, DifficultyMode.MEDIUM, DifficultyMode.HARD];
        for (const diff of allDiffs) {
            this.currentDifficulty = diff;
            this.menuManager?.updateLevelButtonText(this.currentLevel, diff);
        }
        this.currentDifficulty = DifficultyMode.SIMPLE;

        if (this.currentLevel === 1) {
            this.menuManager.loadLevel(1, DifficultyMode.SIMPLE);
        }else{
            this.menuManager.node.active = true;
        }
    }
}
