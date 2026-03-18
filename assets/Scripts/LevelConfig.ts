import { resources } from 'cc';

/**
 * 关卡配置数据类型
 */
export interface GridConfig {
    rows: number;
    columns: number;
}

export interface BlockTypeConfig {
    type: string;
    color?: string;
    sprite?: string;
}

export interface TargetConfig {
    type: 'score' | 'collect' | 'clear';
    value: number;
    targetBlock?: string;
}

export interface LevelData {
    id: number;
    name: string;
    grid: GridConfig;
    blockTypes: string[];
    target: TargetConfig;
    moves: number;
    timeLimit: number;
    specialRules: string[];
    initialBlocks?: string[][];
}

export interface GlobalConfig {
    defaultBlockTypes: string[];
    defaultGrid: GridConfig;
    lineColor: string;
    lineWidth: {
        outer: number;
        inner: number;
    };
}

export interface LevelConfigData {
    levels: LevelData[];
    global: GlobalConfig;
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
        resources.load('levels/level_config', (err, data) => {
            if (err) {
                console.error('加载关卡配置失败:', err);
                callback?.(false);
                return;
            }

            this.configData = data as LevelConfigData;
            console.log('关卡配置加载成功, 共', this.getLevelCount(), '个关卡');
            callback?.(true);
        });
    }

    /**
     * 同步加载关卡配置（需确保资源已预加载）
     */
    public getConfig(): LevelConfigData | null {
        return this.configData;
    }

    /**
     * 获取所有关卡数据
     */
    public getAllLevels(): LevelData[] {
        return this.configData?.levels || [];
    }

    /**
     * 获取关卡总数
     */
    public getLevelCount(): number {
        return this.configData?.levels.length || 0;
    }

    /**
     * 获取指定关卡数据
     * @param levelId 关卡ID (从1开始)
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
     * 设置当前关卡索引
     */
    public setCurrentLevelIndex(index: number): void {
        if (index >= 0 && index < this.getLevelCount()) {
            this.currentLevelIndex = index;
        }
    }

    /**
     * 获取全局配置
     */
    public getGlobalConfig(): GlobalConfig | null {
        return this.configData?.global || null;
    }

    /**
     * 获取指定关卡的网格配置
     */
    public getGridConfig(levelId: number): GridConfig | null {
        const level = this.getLevel(levelId);
        return level?.grid || this.configData?.global.defaultGrid || null;
    }

    /**
     * 获取指定关卡的方块类型列表
     */
    public getBlockTypes(levelId: number): string[] {
        const level = this.getLevel(levelId);
        return level?.blockTypes || this.configData?.global.defaultBlockTypes || [];
    }

    /**
     * 获取指定关卡的目标配置
     */
    public getTarget(levelId: number): TargetConfig | null {
        const level = this.getLevel(levelId);
        return level?.target || null;
    }

    /**
     * 获取指定关卡的移动次数限制
     */
    public getMoves(levelId: number): number {
        const level = this.getLevel(levelId);
        return level?.moves || 0;
    }

    /**
     * 获取指定关卡的时间限制（0表示不限时）
     */
    public getTimeLimit(levelId: number): number {
        const level = this.getLevel(levelId);
        return level?.timeLimit || 0;
    }

    /**
     * 获取指定关卡的特殊规则
     */
    public getSpecialRules(levelId: number): string[] {
        const level = this.getLevel(levelId);
        return level?.specialRules || [];
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
