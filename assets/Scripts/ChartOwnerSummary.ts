import { DifficultySummary, LevelBest } from './PlayerService';

export interface ChartDisplayProfile {
    nickname: string;
    avatarUrl: string;
}

export interface ChartLocalProfileContext {
    openid: string;
    nickname: string;
    avatarUrl: string;
    hasRealProfile: boolean;
}

export interface ChartOwnerSummaryData {
    nickname: string;
    rankText: string;
    valueText: string;
    avatarUrl: string;
}

interface BuildDifficultyOwnerSummaryOptions {
    currentUserId: string;
    ranking: DifficultySummary[];
    cachedLevel: number;
    localProfile: ChartLocalProfileContext | null;
    formatLevelText: (highestLevel: number) => string;
}

interface BuildLevelOwnerSummaryOptions {
    currentUserId: string;
    ranking: LevelBest[];
    localProfile: ChartLocalProfileContext | null;
    formatClearTimeText: (clearTime: number) => string;
}

export class ChartOwnerSummaryBuilder {
    public static buildDifficultyOwnerSummary(options: BuildDifficultyOwnerSummaryOptions): ChartOwnerSummaryData {
        const { currentUserId, ranking, cachedLevel, localProfile, formatLevelText } = options;
        const openid = (currentUserId || localProfile?.openid || '').trim();
        const ownerEntry = openid ? ranking.find((item) => item.userId === openid) ?? null : null;
        const ownerHighestLevel = ownerEntry?.highestLevel ?? Math.max(0, cachedLevel);
        const ownerRank = ownerEntry ? ranking.findIndex((item) => item.userId === ownerEntry.userId) + 1 : 0;
        const rankText = ownerHighestLevel > 0
            ? (ownerRank > 0 ? `${ownerRank}` : (ranking.length > 0 ? `${ranking.length}+` : '--'))
            : '--';
        const valueText = ownerHighestLevel > 0 ? formatLevelText(ownerHighestLevel) : '--';
        const profile = this.resolveDisplayProfile(openid, ownerEntry?.nickname, ownerEntry?.avatarUrl, localProfile);

        return {
            nickname: profile.nickname,
            rankText,
            valueText,
            avatarUrl: profile.avatarUrl
        };
    }

    public static buildLevelOwnerSummary(options: BuildLevelOwnerSummaryOptions): ChartOwnerSummaryData {
        const { currentUserId, ranking, localProfile, formatClearTimeText } = options;
        const openid = (currentUserId || localProfile?.openid || '').trim();
        const ownerEntry = openid ? ranking.find((item) => item.userId === openid) ?? null : null;
        const ownerRank = ownerEntry ? ranking.findIndex((item) => item.userId === ownerEntry.userId) + 1 : 0;
        const profile = this.resolveDisplayProfile(openid, ownerEntry?.nickname, ownerEntry?.avatarUrl, localProfile);

        return {
            nickname: profile.nickname,
            rankText: ownerEntry ? `${ownerRank}` : '--',
            valueText: ownerEntry ? formatClearTimeText(ownerEntry.bestClearTime) : '--',
            avatarUrl: profile.avatarUrl
        };
    }

    public static resolveDisplayProfile(
        userId: string,
        cloudNickname: string | null | undefined,
        cloudAvatarUrl: string | null | undefined,
        localProfile: ChartLocalProfileContext | null
    ): ChartDisplayProfile {
        const preferredLocalProfile = this.getPreferredLocalProfile(userId, localProfile);
        const nickname = preferredLocalProfile?.nickname
            || cloudNickname?.trim()
            || this.getFallbackNickname(userId || localProfile?.openid || '');
        const avatarUrl = preferredLocalProfile?.avatarUrl || cloudAvatarUrl || '';

        return { nickname, avatarUrl };
    }

    public static getFallbackNickname(userId: string): string {
        if (!userId) {
            return '豆友';
        }
        return `豆友${userId.slice(-4)}`;
    }

    private static getPreferredLocalProfile(
        userId: string,
        localProfile: ChartLocalProfileContext | null
    ): ChartDisplayProfile | null {
        if (!localProfile?.hasRealProfile || !userId || userId !== localProfile.openid) {
            return null;
        }

        if (!localProfile.nickname && !localProfile.avatarUrl) {
            return null;
        }

        return {
            nickname: localProfile.nickname,
            avatarUrl: localProfile.avatarUrl
        };
    }
}
