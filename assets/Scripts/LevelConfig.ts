import { resources, JsonAsset } from 'cc';

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
 * 关卡配置数据
 */
export interface LevelConfigData {
    levels: LevelData[];
}

/**
 * 关卡配置管理器
 * 负责加载和解析关卡配置文件
 */
export class LevelConfig {
    private static instance: LevelConfig | null = null;
    private configData: LevelConfigData | null = null;
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
            console.log('关卡配置加载成功, 共', this.getLevelCount(), '个关卡');
            callback?.(true);
        });
    }

    /**
     * 获取关卡总数
     */
    public getLevelCount(): number {
        return this.configData?.levels.length || 0;
    }

    /**
     * 获取指定关卡数据
     */
    public getLevel(levelId: number): LevelData | null {
        return this.configData?.levels.find(level => level.id === levelId) || null;
    }

    /**
     * 获取当前关卡索引
     */
    public getCurrentLevelIndex(): number {
        return this.currentLevelIndex;
    }

    /**
     * 获取当前关卡的网格配置
     */
    public getCurrentGridConfig(): GridConfig | null {
        const level = this.configData?.levels[this.currentLevelIndex];
        return level?.grid || null;
    }

    /**
     * 获取当前关卡的限时（秒）
     */
    public getCurrentLevelTime(): number {
        const level = this.configData?.levels[this.currentLevelIndex];
        return level?.time ?? 60;
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
     * 获取下一个关卡数据
     */
    public getNextLevel(): LevelData | null {
        const nextId = this.configData?.levels[this.currentLevelIndex]?.id + 1 || 1;
        return this.getLevel(nextId);
    }

    /**
     * 进入下一关
     */
    public nextLevel(): boolean {
        if (this.currentLevelIndex < this.getLevelCount() - 1) {
            this.currentLevelIndex++;
            return true;
        }
        return false;
    }

    /**
     * 重置到第一关
     */
    public reset(): void {
        this.currentLevelIndex = 0;
    }
}
