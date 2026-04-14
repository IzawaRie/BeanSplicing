import { _decorator, Component } from 'cc';
import { GameManager, DifficultyMode } from './GameManager';
import CloudbaseDBService from './CloudbaseService';
import { WXManager } from './WXManager';

const { ccclass, property } = _decorator;

// 微信小游戏全局对象类型声明
declare const wx: any;

// 集合名称常量
const COLLECTION_DIFFICULTY_SUMMARY = 'player_difficulty_summary';

// 难度编码映射（与 collections.xlsx 一致）
export const DifficultyCode = {
    SIMPLE: 'easy',
    MEDIUM: 'advanced', 
    HARD: 'master'
} as const;

export type DifficultyCodeType = typeof DifficultyCode[keyof typeof DifficultyCode];

// 难度进度总结
export interface DifficultySummary {
    _id: string;
    userId: string;
    difficulty: DifficultyCodeType;
    nickname: string;
    avatarUrl?: string;
    regionCode?: string;
    regionName?: string;
    highestLevel: number;
}

/**
 * 玩家数据服务
 * 负责玩家数据操作
 */
@ccclass('PlayerService')
export class PlayerService extends Component {
    private static _instance: PlayerService | null = null;

    // 单例获取
    public static get instance(): PlayerService | null {
        return PlayerService._instance;
    }

    onLoad() {
        if (PlayerService._instance) {
            this.node.destroy();
            return;
        }
        PlayerService._instance = this;
    }

    // ========== 辅助方法 ==========

    /**
     * 获取当前玩家 openid
     */
    private getOpenId(): string | null {
        return GameManager.getInstance()?.openid ?? null;
    }

    /**
     * 将 DifficultyMode 转换为 DifficultyCode
     */
    public static toDifficultyCode(difficulty: DifficultyMode): DifficultyCodeType {
        switch (difficulty) {
            case DifficultyMode.SIMPLE: return DifficultyCode.SIMPLE;
            case DifficultyMode.MEDIUM: return DifficultyCode.MEDIUM;
            case DifficultyMode.HARD: return DifficultyCode.HARD;
            default: return DifficultyCode.SIMPLE;
        }
    }

    /**
     * 生成难度总结文档 ID
     */
    public static genDifficultySummaryId(difficulty: DifficultyCodeType, userId: string): string {
        return `${difficulty}#${userId}`;
    }

    // ========== player_difficulty_summary 操作 ==========

    /**
     * 获取玩家的难度进度
     * @param difficulty 难度
     * @returns 难度进度数据，不存在返回 null
     */
    public async getDifficultySummary(difficulty: DifficultyMode): Promise<DifficultySummary | null> {
        const openid = this.getOpenId();
        if (!openid) return null;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genDifficultySummaryId(diffCode, openid);

        return await CloudbaseDBService.getById<DifficultySummary>(COLLECTION_DIFFICULTY_SUMMARY, docId);
    }

    /**
     * 保存/更新玩家难度进度
     * 如果文档存在则更新，不存在则新增
     * @param difficulty 难度
     * @param nickname 昵称
     * @param highestLevel 最高关卡
     * @param avatarUrl 头像URL（可选）
     * @param regionCode 地区编码（可选）
     * @param regionName 地区名称（可选）
     * @returns 是否保存成功
     */
    public async saveDifficultySummary(
        difficulty: DifficultyMode,
        nickname: string,
        highestLevel: number,
        avatarUrl?: string,
        regionCode?: string,
        regionName?: string
    ): Promise<boolean> {
        const openid = this.getOpenId();
        if (!openid) return false;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genDifficultySummaryId(diffCode, openid);

        const data: DifficultySummary = {
            _id: docId,
            userId: openid,
            difficulty: diffCode,
            nickname: nickname,
            highestLevel: highestLevel
        };

        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
        if (regionCode !== undefined) data.regionCode = regionCode;
        if (regionName !== undefined) data.regionName = regionName;

        // 使用 upsert：存在则更新，不存在则新增
        return await CloudbaseDBService.upsert(COLLECTION_DIFFICULTY_SUMMARY, docId, data);
    }

    /**
     * 更新玩家难度进度中的最高关卡
     * 只有当新关卡大于当前最高关卡时才更新
     * @param difficulty 难度
     * @param newLevel 新通关的关卡
     * @returns 是否更新成功
     */
    public async updateHighestLevelIfBetter(difficulty: DifficultyMode, newLevel: number): Promise<boolean> {
        const openid = this.getOpenId();
        if (!openid) return false;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genDifficultySummaryId(diffCode, openid);

        // 先获取当前记录
        const current = await CloudbaseDBService.getById<DifficultySummary>(COLLECTION_DIFFICULTY_SUMMARY, docId);

        if (!current) {
            // 不存在，直接创建
            return await this.saveDifficultySummary(difficulty, '玩家', newLevel);
        }

        // 如果新关卡更大，更新
        if (newLevel > current.highestLevel) {
            return await CloudbaseDBService.update(COLLECTION_DIFFICULTY_SUMMARY, docId, {
                highestLevel: newLevel
            });
        }

        // 无需更新
        return true;
    }

    /**
     * 获取难度排行榜（按最高关卡降序）
     * @param difficulty 难度
     * @param limit 返回数量，默认 10
     * @returns 排行榜数据数组
     */
    public async getDifficultyRanking(difficulty: DifficultyMode, limit: number = 10): Promise<DifficultySummary[]> {
        const diffCode = PlayerService.toDifficultyCode(difficulty);

        return await CloudbaseDBService.query<DifficultySummary>(COLLECTION_DIFFICULTY_SUMMARY, {
            where: { difficulty: diffCode },
            orderByDesc: 'highestLevel',
            limit: limit
        });
    }

    /**
     * 删除玩家难度进度（很少用到）
     * @param difficulty 难度
     * @returns 是否删除成功
     */
    public async deleteDifficultySummary(difficulty: DifficultyMode): Promise<boolean> {
        const openid = this.getOpenId();
        if (!openid) return false;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genDifficultySummaryId(diffCode, openid);

        return await CloudbaseDBService.delete(COLLECTION_DIFFICULTY_SUMMARY, docId);
    }

    // ========== 同步与初始化 ==========

    /**
     * 获取本地缓存的关卡数
     * @param difficulty 难度
     * @returns 缓存的关卡数，没有则返回 0
     */
    public getCachedLevel(difficulty: DifficultyMode): number {
        const key = `level_${difficulty}`;
        if (typeof (wx) !== 'undefined') {
            return wx.getStorageSync(key) || 1;
        }
        return 1;
    }

    /**
     * 更新本地缓存的关卡数
     * @param difficulty 难度
     * @param level 关卡数
     */
    public setCachedLevel(difficulty: DifficultyMode, level: number): void {
        const key = `level_${difficulty}`;
        if (typeof (wx) !== 'undefined') {
            wx.setStorageSync(key, level);
        }
    }

    /**
     * 同步本地缓存与云数据的关卡进度
     * 在本地缓存初始化完成后调用，用于解决多端数据不一致问题
     * 
     * 同步规则：
     * - 云数据为 null → 用本地缓存创建云数据
     * - 缓存关卡 < 云数据 → 更新本地缓存
     * - 缓存关卡 > 云数据 → 更新云数据
     */
    public async syncProgressWithCloud(): Promise<void> {
        const openid = this.getOpenId();
        if (!openid) {
            console.warn('PlayerService: 没有 openid，无法同步');
            return;
        }

        console.log('PlayerService: 开始同步关卡进度...');

        // 从 WXManager 获取昵称和头像
        const wxMgr = WXManager.instance;
        const nickname = wxMgr?.nickname || '玩家';
        const avatarUrl = wxMgr?.avatarUrl || '';

        // 遍历三个难度
        const difficulties = [DifficultyMode.SIMPLE, DifficultyMode.MEDIUM, DifficultyMode.HARD];
        
        for (const difficulty of difficulties) {
            const cloudData = await this.getDifficultySummary(difficulty);
            const cachedLevel = this.getCachedLevel(difficulty);
            const diffName = PlayerService.toDifficultyCode(difficulty);

            if (!cloudData) {
                // 云数据不存在，使用本地缓存创建
                if (cachedLevel > 0) {
                    console.log(`PlayerService: ${diffName} 云数据为空，使用本地缓存创建: ${cachedLevel}`);
                    await this.saveDifficultySummary(difficulty, nickname, cachedLevel, avatarUrl);
                } else {
                    console.log(`PlayerService: ${diffName} 云数据和本地缓存都为空`);
                }
            } else {
                if (cachedLevel == cloudData.highestLevel) continue;
                
                console.log(`PlayerService: ${diffName} 本地缓存(${cachedLevel}) > 云数据(${cloudData.highestLevel})，更新云端`);
                await this.saveDifficultySummary(difficulty, nickname, cachedLevel, avatarUrl);
            }
        }

        console.log('PlayerService: 关卡进度同步完成');
    }
}

// 导出单例快捷访问
export const playerService = PlayerService.instance;
