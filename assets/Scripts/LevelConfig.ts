import { resources, JsonAsset } from 'cc';
import { DifficultyMode } from './GameManager';

/**
 * 网格配置
 */
export interface GridConfig {
    rows: number;
    columns: number;
}

/**
 * 关卡数据
 */
export interface LevelData {
    id: number;
    name: string;
    grid: GridConfig;
    patternPath: string;
    time?: number;  // 关卡限时（秒），默认 60
}

/**
 * 关卡配置数据（支持三种难度）
 */
export interface LevelConfigData {
    simple: LevelData[];
    medium: LevelData[];
    hard: LevelData[];
}

/**
 * 关卡配置管理器
 * 负责加载和解析关卡配置文件
 */
export class LevelConfig {
    private static instance: LevelConfig | null = null;
    private configData: LevelConfigData | null = null;
    private currentDifficulty: DifficultyMode = DifficultyMode.SIMPLE;
    private currentLevelIndex: number = 0;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): LevelConfig {
        if (!LevelConfig.instance) {
            LevelConfig.instance = new LevelConfig();
        }
        return LevelConfig.instance;
    }

    /**
     * 加载关卡配置文件
     */
    public loadConfig(callback?: (success: boolean) => void): void {
        resources.load('levels/level_config', JsonAsset, (err, data) => {
            if (err) {
                console.error('加载关卡配置失败:', err);
                callback?.(false);
                return;
            }

            this.configData = (data as JsonAsset).json as LevelConfigData;
            console.log('关卡配置加载成功');
            console.log(`  简单模式: ${this.getLevelCount(DifficultyMode.SIMPLE)} 关`);
            console.log(`  中等模式: ${this.getLevelCount(DifficultyMode.MEDIUM)} 关`);
            console.log(`  困难模式: ${this.getLevelCount(DifficultyMode.HARD)} 关`);
            callback?.(true);
        });
    }

    /**
     * 获取指定难度的关卡总数
     */
    public getLevelCount(difficulty?: DifficultyMode): number {
        const diff = difficulty ?? this.currentDifficulty;
        return this.configData?.[diff]?.length || 0;
    }

    /**
     * 检查指定难度的指定关卡是否存在
     */
    public hasLevel(levelId: number, difficulty?: DifficultyMode): boolean {
        const diff = difficulty ?? this.currentDifficulty;
        const level = this.configData?.[diff]?.find(l => l.id === levelId);
        return level !== undefined;
    }

    /**
     * 获取指定难度和关卡号的数据
     */
    public getLevel(levelId: number, difficulty?: DifficultyMode): LevelData | null {
        const diff = difficulty ?? this.currentDifficulty;
        return this.configData?.[diff]?.find(level => level.id === levelId) || null;
    }

    /**
     * 获取当前难度和索引对应的关卡数据
     */
    public getCurrentLevel(): LevelData | null {
        return this.configData?.[this.currentDifficulty]?.[this.currentLevelIndex] || null;
    }

    /**
     * 获取当前关卡索引
     */
    public getCurrentLevelIndex(): number {
        return this.currentLevelIndex;
    }

    /**
     * 获取当前难度的网格配置
     */
    public getCurrentGridConfig(): GridConfig | null {
        const level = this.getCurrentLevel();
        return level?.grid || null;
    }

    /**
     * 获取当前关卡的限时（秒）
     */
    public getCurrentLevelTime(): number {
        const level = this.getCurrentLevel();
        return level?.time ?? 60;
    }

    /**
     * 设置当前难度
     * 注意：不会重置 currentLevelIndex，由调用方负责同步
     */
    public setDifficulty(difficulty: DifficultyMode): void {
        this.currentDifficulty = difficulty;
    }

    /**
     * 获取当前难度
     */
    public getDifficulty(): DifficultyMode {
        return this.currentDifficulty;
    }

    /**
     * 设置当前关卡索引
     */
    public setCurrentLevelIndex(index: number): void {
        if (index >= 0 && index < this.getLevelCount()) {
            this.currentLevelIndex = index;
        }
    }

    /**
     * 重置到第一关
     */
    public reset(): void {
        this.currentLevelIndex = 0;
    }
}
