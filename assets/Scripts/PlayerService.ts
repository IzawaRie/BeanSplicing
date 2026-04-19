import { _decorator, Component } from 'cc';
import { GameManager, DifficultyMode } from './GameManager';
import CloudbaseDBService, { callFunction } from './CloudbaseService';
import { WXManager } from './WXManager';

const { ccclass, property } = _decorator;

// 微信小游戏全局对象类型声明
declare const wx: any;

// 集合名称常量
const COLLECTION_DIFFICULTY_SUMMARY = 'player_difficulty_summary';
const COLLECTION_LEVEL_BEST = 'player_level_best';
const COLLECTION_PLAYERS = 'players';

// 玩家信息
export interface Player {
    _id: string;
    userId: string;
    nickname: string;
    avatarUrl?: string;
    createdAt: Date;
    lastLoginAt: Date;
}

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
    highestLevel: number;
}

// 单关最佳成绩
export interface LevelBest {
    _id: string;
    userId: string;
    difficulty: DifficultyCodeType;
    levelNo: number;
    nickname: string;
    avatarUrl?: string;
    bestClearTime: number;
}

interface QueryDocumentsResult<T> {
    success: boolean;
    mode?: 'doc' | 'list' | 'count';
    data?: T[];
    error?: string;
    pagination?: {
        skip: number;
        limit: number;
        actualCount: number;
        total: number;
    };
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
     * 确保当前玩家 openid 可用，不足时尝试补拉一次并写回 GameManager
     */
    private async ensureOpenId(): Promise<string | null> {
        let openid = this.getOpenId();
        if (openid) return openid;

        openid = await WXManager.instance?.getOpenId() ?? null;
        if (openid) {
            GameManager.getInstance()?.setOpenid(openid);
        }
        return openid;
    }

    /**
     * 获取用于云端展示的玩家信息
     */
    private getPlayerProfile(openid: string): { nickname: string; avatarUrl: string } {
        const wxMgr = WXManager.instance;
        const fallbackNickname = `豆友${openid.slice(-4)}`;
        return {
            nickname: wxMgr?.nickname?.trim() || fallbackNickname,
            avatarUrl: wxMgr?.avatarUrl || ''
        };
    }

    private async queryRankingByCloudFunction<T>(
        collection: string,
        where: Record<string, any>,
        orderBy: string,
        order: 'asc' | 'desc',
        limit: number
    ): Promise<T[]> {
        const safeLimit = Math.max(1, Math.floor(limit || 10));
        const res = await callFunction('query_documents', {
            collection,
            where,
            orderBy,
            order,
            limit: safeLimit,
            skip: 0,
            countOnly: false
        });

        const result = res?.result as QueryDocumentsResult<T> | undefined;
        if (!result?.success) {
            console.warn(`[PlayerService] query_documents failed for ${collection}`, result?.error || res);
            return [];
        }

        const data = Array.isArray(result.data) ? result.data : [];
        console.log(`[PlayerService] query_documents success for ${collection}, requestedLimit=${safeLimit}, actualCount=${data.length}, total=${result.pagination?.total ?? 0}`);
        return data;
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

    /**
     * 生成关卡最佳成绩文档 ID
     */
    public static genLevelBestId(difficulty: DifficultyCodeType, levelNo: number, userId: string): string {
        return `${difficulty}#${levelNo}#${userId}`;
    }

    // ========== player_level_best 操作 ==========

    /**
     * 获取玩家某关卡的最佳成绩
     * @param difficulty 难度
     * @param levelNo 关卡编号
     * @returns 最佳成绩数据，不存在返回 null
     */
    public async getLevelBest(difficulty: DifficultyMode, levelNo: number): Promise<LevelBest | null> {
        const openid = await this.ensureOpenId();
        if (!openid) return null;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genLevelBestId(diffCode, levelNo, openid);

        return await CloudbaseDBService.getById<LevelBest>(COLLECTION_LEVEL_BEST, docId);
    }

    /**
     * 保存玩家某关卡的通关成绩
     * 如果存在记录则比较时间，保留最短的
     * @param difficulty 难度
     * @param levelNo 关卡编号
     * @param clearTime 通关时间（秒）
     * @param nickname 昵称
     * @param avatarUrl 头像URL（可选）
     * @returns 是否保存成功
     */
    public async saveLevelBest(
        difficulty: DifficultyMode,
        levelNo: number,
        clearTime: number,
        nickname?: string,
        avatarUrl?: string
    ): Promise<boolean> {
        const openid = await this.ensureOpenId();
        if (!openid) return false;
        const profile = this.getPlayerProfile(openid);
        const finalNickname = nickname?.trim() || profile.nickname;
        const finalAvatarUrl = avatarUrl ?? profile.avatarUrl;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genLevelBestId(diffCode, levelNo, openid);

        // 先检查是否已有记录
        const existing = await CloudbaseDBService.getById<LevelBest>(COLLECTION_LEVEL_BEST, docId);

        // 如果已有记录且时间更长，不保存
        if (existing && existing.bestClearTime <= clearTime) {
            console.log(`关卡 ${levelNo} 已有更佳记录: ${existing.bestClearTime}s，当前: ${clearTime}s，跳过`);
            return true;
        }

        const data: LevelBest = {
            _id: docId,
            userId: openid,
            difficulty: diffCode,
            levelNo: levelNo,
            nickname: finalNickname,
            bestClearTime: clearTime
        };

        if (finalAvatarUrl !== undefined) data.avatarUrl = finalAvatarUrl;

        // 使用 upsert：存在则更新，不存在则新增
        return await CloudbaseDBService.upsert(COLLECTION_LEVEL_BEST, docId, data);
    }

    /**
     * 获取某关卡的排行榜（按最佳通关时间升序）
     * @param difficulty 难度
     * @param levelNo 关卡编号
     * @param limit 返回数量，默认 10
     * @returns 排行榜数据数组
     */
    public async getLevelRanking(difficulty: DifficultyMode, levelNo: number, limit: number = 10): Promise<LevelBest[]> {
        const diffCode = PlayerService.toDifficultyCode(difficulty);
        return await this.queryRankingByCloudFunction<LevelBest>(
            COLLECTION_LEVEL_BEST,
            { difficulty: diffCode, levelNo: levelNo },
            'bestClearTime',
            'asc',
            limit
        );
    }

    // ========== player_difficulty_summary 操作 ==========

    /**
     * 获取玩家的难度进度
     * @param difficulty 难度
     * @returns 难度进度数据，不存在返回 null
     */
    public async getDifficultySummary(difficulty: DifficultyMode): Promise<DifficultySummary | null> {
        const openid = await this.ensureOpenId();
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
     * @returns 是否保存成功
     */
    public async saveDifficultySummary(
        difficulty: DifficultyMode,
        nickname: string | undefined,
        highestLevel: number,
        avatarUrl?: string
    ): Promise<boolean> {
        const openid = await this.ensureOpenId();
        if (!openid) return false;
        const profile = this.getPlayerProfile(openid);
        const finalNickname = nickname?.trim() || profile.nickname;
        const finalAvatarUrl = avatarUrl ?? profile.avatarUrl;

        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genDifficultySummaryId(diffCode, openid);

        const data: DifficultySummary = {
            _id: docId,
            userId: openid,
            difficulty: diffCode,
            nickname: finalNickname,
            highestLevel: highestLevel
        };

        if (finalAvatarUrl !== undefined) data.avatarUrl = finalAvatarUrl;

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
        const openid = await this.ensureOpenId();
        if (!openid) return false;

        const profile = this.getPlayerProfile(openid);
        const diffCode = PlayerService.toDifficultyCode(difficulty);
        const docId = PlayerService.genDifficultySummaryId(diffCode, openid);

        // 先获取当前记录
        const current = await CloudbaseDBService.getById<DifficultySummary>(COLLECTION_DIFFICULTY_SUMMARY, docId);

        if (!current) {
            // 不存在，直接创建
            return await this.saveDifficultySummary(difficulty, profile.nickname, newLevel, profile.avatarUrl);
        }

        // 如果新关卡更大，更新
        if (newLevel > current.highestLevel) {
            return await CloudbaseDBService.update(COLLECTION_DIFFICULTY_SUMMARY, docId, {
                highestLevel: newLevel,
                nickname: profile.nickname,
                avatarUrl: profile.avatarUrl
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
        return await this.queryRankingByCloudFunction<DifficultySummary>(
            COLLECTION_DIFFICULTY_SUMMARY,
            { difficulty: diffCode },
            'highestLevel',
            'desc',
            limit
        );
    }

    /**
     * 删除玩家难度进度（很少用到）
     * @param difficulty 难度
     * @returns 是否删除成功
     */
    public async deleteDifficultySummary(difficulty: DifficultyMode): Promise<boolean> {
        const openid = await this.ensureOpenId();
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
        const openid = await this.ensureOpenId();
        if (!openid) {
            console.warn('PlayerService: 没有 openid，无法同步');
            return;
        }

        console.log('PlayerService: 开始同步关卡进度...');

        const profile = this.getPlayerProfile(openid);

        // 遍历三个难度
        const difficulties = [DifficultyMode.SIMPLE, DifficultyMode.MEDIUM, DifficultyMode.HARD];
        
        for (const difficulty of difficulties) {
            const cloudData = await this.getDifficultySummary(difficulty);
            const cachedLevel = this.getCachedLevel(difficulty) - 1;
            const diffName = PlayerService.toDifficultyCode(difficulty);

            if (!cloudData) {
                // 云数据不存在，使用本地缓存创建
                if (cachedLevel > 0) {
                    console.log(`PlayerService: ${diffName} 云数据为空，使用本地缓存创建: ${cachedLevel}`);
                    await this.saveDifficultySummary(difficulty, profile.nickname, cachedLevel, profile.avatarUrl);
                } else {
                    console.log(`PlayerService: ${diffName} 云数据和本地缓存都为空`);
                }
            } else {
                // 云数据存在
                if (cachedLevel == cloudData.highestLevel || cachedLevel == 0) continue;

                console.log(`PlayerService: ${diffName} 本地缓存(${cachedLevel}) > 云数据(${cloudData.highestLevel})，更新云端`);
                await this.saveDifficultySummary(difficulty, profile.nickname, cachedLevel, profile.avatarUrl);
            }
        }

        console.log('PlayerService: 关卡进度同步完成');
    }

    // ==================== 玩家信息集合 ====================

    /**
     * 获取玩家信息
     */
    public async getPlayer(): Promise<Player | null> {
        const openid = await this.ensureOpenId();
        if (!openid) return null;
        return await CloudbaseDBService.getById<Player>(COLLECTION_PLAYERS, openid);
    }

    /**
     * 保存玩家信息（首次创建或更新最后登录时间）
     * @param nickname 玩家昵称
     * @param avatarUrl 头像URL
     */
    public async savePlayer(nickname?: string, avatarUrl?: string): Promise<boolean> {
        const openid = await this.ensureOpenId();
        if (!openid) return false;
        const profile = this.getPlayerProfile(openid);
        const finalNickname = nickname?.trim() || profile.nickname;
        const finalAvatarUrl = avatarUrl ?? profile.avatarUrl;

        const now = new Date();
        const existing = await this.getPlayer();

        const data: Player = {
            _id: openid,
            userId: openid,
            nickname: finalNickname,
            avatarUrl: finalAvatarUrl || '',
            createdAt: existing?.createdAt ?? now,
            lastLoginAt: now
        };

        return await CloudbaseDBService.upsert(COLLECTION_PLAYERS, openid, data);
    }

    /**
     * 更新玩家最后登录时间
     */
    public async updateLastLoginTime(): Promise<boolean> {
        const openid = await this.ensureOpenId();
        if (!openid) return false;

        const player = await this.getPlayer();
        if (!player) {
            // 玩家不存在，调用 savePlayer 创建
            return await this.savePlayer();
        }

        return await CloudbaseDBService.update(COLLECTION_PLAYERS, openid, {
            lastLoginAt: new Date()
        });
    }

    public async syncAuthorizedProfile(nickname?: string, avatarUrl?: string): Promise<void> {
        const openid = await this.ensureOpenId();
        if (!openid) return;

        const profile = this.getPlayerProfile(openid);
        const finalNickname = nickname?.trim() || profile.nickname;
        const finalAvatarUrl = avatarUrl ?? profile.avatarUrl;
        const patchData = {
            nickname: finalNickname,
            avatarUrl: finalAvatarUrl
        };

        await this.savePlayer(finalNickname, finalAvatarUrl);

        const difficultySummaries = await CloudbaseDBService.query<DifficultySummary>(COLLECTION_DIFFICULTY_SUMMARY, {
            where: { userId: openid },
            limit: 200
        });
        await Promise.all(difficultySummaries.map((summary) =>
            CloudbaseDBService.update(COLLECTION_DIFFICULTY_SUMMARY, summary._id, patchData)
        ));

        const levelBests = await CloudbaseDBService.query<LevelBest>(COLLECTION_LEVEL_BEST, {
            where: { userId: openid },
            limit: 200
        });
        await Promise.all(levelBests.map((record) =>
            CloudbaseDBService.update(COLLECTION_LEVEL_BEST, record._id, patchData)
        ));
    }
}

// 导出单例快捷访问
export const playerService = PlayerService.instance;
