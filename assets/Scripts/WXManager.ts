import { _decorator, Component, Node } from 'cc';
import { GameManager, DifficultyMode } from './GameManager';
import { callFunction } from './CloudbaseService';
const { ccclass, property} = _decorator;

// 微信小游戏全局对象类型声明
declare const wx: any;

type SubscribeMessageStatus = 'accept' | 'reject' | 'ban' | 'filter' | '';

interface RequestSubscribeMessageResult {
    success: boolean;
    result: Record<string, SubscribeMessageStatus>;
    error?: string;
}

interface SubscribeMessageSettingResult {
    success: boolean;
    mainSwitch: boolean | null;
    itemSettings: Record<string, SubscribeMessageStatus>;
    error?: string;
}

interface CreateSubscribeTaskOptions {
    templateId: string;
    payload: Record<string, any>;
    sendAt: number;
    page?: string;
    scene?: string;
    miniprogramState?: 'developer' | 'trial' | 'formal';
    dedupeKey?: string;
}

interface SubscribeTaskClientResult {
    success: boolean;
    subscribeStatus?: SubscribeMessageStatus;
    subscribeResult?: Record<string, SubscribeMessageStatus>;
    taskResult?: any;
    duplicated?: boolean;
    taskId?: string;
    error?: string;
}

/**
 * 云存储管理器
 * 接入微信小游戏 wx.setUserCloudStorage 接口
 */
@ccclass('WXManager')
export class WXManager extends Component {

    @property({ type: Node })
    testBtn: Node = null;

    subscribeTemplateId: string = 'dhpYKr-YayyWv_ibni2T5BmxwdhCkxoSbwWpijjrLtc';
    subscribePage: string = '';
    subscribeTipField: string = 'thing2';
    subscribeCurrentPowerField: string = 'character_string5';

    // 激励视频广告实例
    private rewardedVideoAd: any = null;
    private interstitialAd: any = null;
    // 激励视频广告位 id（在微信公众平台广告位配置获取）
    private readonly VIDEO_AD_UNIT_ID: string = 'adunit-f7349bec4122701f';
    private readonly INTERSTITIAL_AD_UNIT_ID: string = 'adunit-613709c057d35ead';
    // 是否为调试模式（正式版但广告位为 test123 时启用）
    private isDebugMode: boolean = false;

    // 分享图片 ID（在微信公众平台「增长入口」→「小程序分享图」上传获取）
    private _imageUrlId: string = 'qGwwwryFRtmUgxcDjf2p3w==';
    // 分享图片 URL（必须 HTTPS）
    private _imageUrl: string = 'https://mmocgame.qpic.cn/wechatgame/f4uuDhnRAxMTJF1dLAUnqlLAKiaIMZfsk7uHGIUribuCc8ibicOmTxAVDvvG6LMQLTMb/0';

    onLoad() {
        this.showShareMenu();
        // imageUrlId、imageUrl：在微信公众平台「增长入口」→「小程序分享图」上传后获得的图片 ID 和图片 URL
        this.onShareAppMessage('快来和我一起拼豆！');
        if (!this.isDebugMode) {
            this.createRewardedVideoAd();
            this.createInterstitialAd();
        }
    }

    // ========== 激励视频广告 ==========
    private skillRewardedVideoClosed: ((success: boolean) => void) | null = null;

    /**
     * 创建激励视频广告
     */
    private createRewardedVideoAd(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            this.rewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: this.VIDEO_AD_UNIT_ID
            });

            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频广告加载完成');
            });

            this.rewardedVideoAd.onError((err: any) => {
                console.warn('激励视频广告错误:', err);
            });

            this.rewardedVideoAd.onClose((res: any) => {
                if (res && res.isEnded) {
                    console.log('激励视频广告播放完成，发放奖励');
                    this.skillRewardedVideoClosed?.(true);
                } else {
                    console.log('激励视频广告未看完，不发放奖励');
                    this.skillRewardedVideoClosed?.(false);
                }
                this.skillRewardedVideoClosed = null;
            });
        } catch (e) {
            console.warn('创建激励视频广告失败:', e);
        }
    }

    /**
     * 显示激励视频广告
     * @param callback 播放结束后的回调，参数表示是否完整看完
     */
    public showRewardedVideoAd(callback: (success: boolean) => void): void {
        if (typeof (wx) === 'undefined') {
            callback?.(true);
            return;
        }

        if (this.isDebugMode) {
            callback?.(true);
            return;
        }

        if (!this.rewardedVideoAd) {
            console.warn('激励视频广告未创建');
            callback?.(false);
            return;
        }

        this.skillRewardedVideoClosed = callback;

        this.rewardedVideoAd.show().then(() => {
            console.log('激励视频广告显示成功');
        }).catch((err: any) => {
            this.rewardedVideoAd.load().then(() => {
                return this.rewardedVideoAd.show();
            }).catch(() => {
                this.skillRewardedVideoClosed?.(false);
                this.skillRewardedVideoClosed = null;
            });
        });
    }

    // ========== 游戏圈 ==========
    private gameClubOpenLink: string = '-SSEykJvFV3pORt5kTNpS_6DPrRDfozxCy2jEFL07zx4R-MPpU1tST5hbtFc_HIAj2wCkd5SAVv3YF0b64mCaSig10g5_N-0VSt13L2-6XHYTPxYuYHrwKWDWcpLZH54HOsgGoyYRB8BRKGj2OmqcX0cBZgDOBWwBNIHZuH3cxSpsLFkmn6DZ4vYzCND_U8NGLS3k-FzDYC6WmFvxUXNRonP7Vw17RgTuj0vJWDeXQJOZUkmujqMLLjnh1ZICLPLhOX0zLLntMnnS8U2jrhN74hPjDwO1ibU1ilk6z6Q37J1P2K_USQMxVSmEQ071HbS5w_PKiVKTmNb2zkBGKRMoA';
    private gameClubOpenLink_Recommend: string = 'FM09ILkjlQxM0OIigsWiuGIdFe7FV0HoNKXS8V9PYREEYfFyUYW8l60mFmyI6DFMUFslSKzrqX1aQkxGqUPSPfOr65rBAZfQcI936dkW2d43YKa3xHDvgKRQtEpwy7cyfybIZpj7ZYRQ2JKuyfv_VSUXicFhZ4KZki3DfCNednhmOUd_HVgd2DKnPoc0r4gUDpc_qbnW25Ki5R4wyqbWRbX_TACzPcYGYD8opptw4SVlN-M2yWX7BxO-I4CFGsm0Qd2-lxh47Njg7FB1vzaFDOT4FRjTyIpLF7cSHbcYIfE2givsB-alDWE2gIf1iBXdWc0ZTrpSOm2TeA1G_hHE3-6B4VAmNc8VOrhFD3zcp3D5lMmSqO6NZreR30CRSJg_kKisDgvsvt_v1ssABrr46A';
    /**
     * 设置游戏圈 openLink（需在微信公众平台获取）
     * @param openLink 活动或功能的 openLink
     */
    public setGameClubOpenLink(openLink: string): void {
        this.gameClubOpenLink = openLink;
    }

    /**
     * 打开游戏圈
     */
    public openGameClub(): void {
        if (typeof (wx) === 'undefined') return;
        if (!this.gameClubOpenLink) {
            console.warn('游戏圈 openLink 未设置，请先调用 setGameClubOpenLink 设置');
            return;
        }

        const pageManager = wx.createPageManager();
        pageManager.load({
            openlink: this.gameClubOpenLink
        }).then((res: any) => {
            console.log('游戏圈加载成功:', res);
            pageManager.show();
        }).catch((err: any) => {
            console.warn('游戏圈加载失败:', err);
        });
    }

    // 推荐位 openLink
    private readonly RECOMMEND_OPENLINK: string = 'TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw';

    /**
     * 打开推荐位
     */
    public openRecommend(): void {
        if (typeof (wx) === 'undefined') return;

        const pageManager = wx.createPageManager();
        pageManager.load({
            openlink: this.RECOMMEND_OPENLINK
        }).then((res: any) => {
            console.log('推荐位加载成功:', res);
            pageManager.show();
        }).catch((err: any) => {
            console.warn('推荐位加载失败:', err);
        });
    }

    /**
     * 创建插屏广告
     */
    private createInterstitialAd(): void {
        if (typeof (wx) === 'undefined') return;
        if (typeof wx.createInterstitialAd !== 'function') return;

        try {
            this.interstitialAd = wx.createInterstitialAd({
                adUnitId: this.INTERSTITIAL_AD_UNIT_ID
            });

            this.interstitialAd.onLoad(() => {
                console.log('插屏广告加载完成');
            });

            this.interstitialAd.onError((err: any) => {
                console.warn('插屏广告错误:', err);
            });

            this.interstitialAd.onClose(() => {
                console.log('插屏广告已关闭');
            });
        } catch (e) {
            console.warn('创建插屏广告失败:', e);
        }
    }

    /**
     * 显示插屏广告
     */
    public showInterstitialAd(): void {
        if (typeof (wx) === 'undefined') return;
        if (this.isDebugMode) return;
        if (!this.interstitialAd) {
            console.warn('插屏广告未创建');
            return;
        }

        this.interstitialAd.show().catch(() => {
            this.interstitialAd.load().then(() => {
                return this.interstitialAd.show();
            }).catch((err: any) => {
                console.warn('插屏广告显示失败:', err);
            });
        });
    }

    /**
     * 显示分享菜单
     * @param withShareTicket 是否使用 shareTicket，默认为 false
     * @param menus 分享功能菜单，默认为 ['shareAppMessage', 'shareTimeline']
     */
    public showShareMenu(
        withShareTicket: boolean = false,
        menus: string[] = ['shareAppMessage', 'shareTimeline']
    ): void {
        if (typeof (wx) === 'undefined') return;

        try {
            wx.showShareMenu?.({
                withShareTicket,
                menus,
                success: () => console.log('分享菜单已显示'),
                fail: (err: any) => console.warn('显示分享菜单失败:', err)
            });
        } catch (e) {
            console.warn('显示分享菜单失败:', e);
        }
    }

    /**
     * 隐藏分享菜单
     */
    public hideShareMenu(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            wx.hideShareMenu?.({
                success: () => console.log('分享菜单已隐藏'),
                fail: (err: any) => console.warn('隐藏分享菜单失败:', err)
            });
        } catch (e) {
            console.warn('隐藏分享菜单失败:', e);
        }
    }

    /**
     * 自定义分享内容
     * @param title 分享标题，默认使用小程序名称
     */
    public onShareAppMessage(title?: string): void {
        if (typeof (wx) === 'undefined') return;

        wx.onShareAppMessage(() => ({
            title: title ?? '',
            imageUrlId: this._imageUrlId,
            imageUrl: this._imageUrl,
        }));
    }

    /**
     * 设置分享图片（需在 onLoad 之前或在编辑器面板中配置）
     * @param imageUrlId 素材图片 ID
     * @param imageUrl 分享图片 URL
     */
    public setShareImage(imageUrlId: string, imageUrl: string): void {
        this._imageUrlId = imageUrlId;
        this._imageUrl = imageUrl;
    }

    /**
     * 主动分享（调用后显示分享面板，用户选择好友/群后完成分享）
     * @param title 分享标题
     * @param query 分享链接后的参数，格式 'key1=value1&key2=value2'
     * @param withShareTicket 是否使用 shareTicket，默认 false
     */
    public shareAppMessage(
        title: string,
        withShareTicket: boolean = false
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof (wx) === 'undefined') {
                reject(new Error('不在微信小游戏环境中'));
                return;
            }

            wx.shareAppMessage({
                title: title,
                imageUrl: this._imageUrl,
                imageUrlId: this._imageUrlId,
                withShareTicket,
                success: () => {
                    console.log('主动分享成功');
                    resolve();
                },
                fail: (err: any) => {
                    console.warn('主动分享失败:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 设置截屏/录屏时隐藏画面
     */
    public setCaptureRestricted(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            wx.setVisualEffectOnCapture?.({
                visualEffect: 'hidden',
                success: () => console.log('截屏限制已开启'),
                fail: (err: any) => console.warn('设置截屏限制失败:', err)
            });
        } catch (e) {
            console.warn('设置截屏限制失败:', e);
        }
    }

    /**
     * 恢复截屏/录屏正常显示
     */
    public setCaptureNone(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            wx.setVisualEffectOnCapture?.({
                visualEffect: 'none',
                success: () => console.log('截屏限制已恢复'),
                fail: (err: any) => console.warn('恢复截屏限制失败:', err)
            });
        } catch (e) {
            console.warn('恢复截屏限制失败:', e);
        }
    }

    start() {
        if (this.testBtn) {
            this.testBtn.on(Node.EventType.TOUCH_END, this.onTestBtnClick, this);
        }
    }

    private onTestBtnClick(): void {
        if (GameManager.getInstance()?.isWindowBlocking()) return;
        this.clearStorageLevel();
    }

    public async getStorageLevel(): Promise<number | null> {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return null;
        }
        
        return new Promise((resolve) => {
            wx.getStorage({
                key: 'level',
                success (res) {
                    resolve(res.data);
                },
                fail () {
                    console.log('getStorageLevel fail');
                    resolve(null);
                }
            });
        });
    }

    public setStorageLevel(level){
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return null;
        }

        wx.setStorageSync('level', level);
    }

    /**
     * 清除所有难度的关卡缓存
     */
    public clearStorageLevel(): void {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return;
        }

        wx.removeStorageSync('level_simple');
        wx.removeStorageSync('level_medium');
        wx.removeStorageSync('level_hard');
        console.log('已清除所有难度关卡缓存');
    }

    /**
     * 按难度保存关卡数
     */
    public setStorageLevelByDifficulty(difficulty: DifficultyMode, level: number): void {
        if (typeof (wx) === 'undefined') return;
        wx.setStorageSync(`level_${difficulty}`, level);
    }

    /**
     * 按难度获取关卡数
     */
    public getStorageLevelByDifficulty(difficulty: DifficultyMode): Promise<number | null> {
        if (typeof (wx) === 'undefined') return Promise.resolve(null);
        return new Promise((resolve) => {
            wx.getStorage({
                key: `level_${difficulty}`,
                success(res) {
                    resolve(res.data);
                },
                fail() {
                    resolve(null);
                }
            });
        });
    }

    /**
     * 短振动
     * @param type 振动强度类型：'heavy'（重）、'medium'（中）、'light'（轻），默认 'medium'
     */
    public vibrateShort(
        type: 'heavy' | 'medium' | 'light' = 'medium'
    ): void {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return;
        }

        if (typeof wx.vibrateShort !== 'function') {
            console.warn('wx.vibrateShort 不可用');
            return;
        }

        wx.vibrateShort({
            type,
            success: () => {
                console.log('短振动成功');
            },
            fail: (err: any) => {
                console.warn('短振动失败:', err);
            }
        });
    }

    public setShake(isShake: boolean){
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return null;
        }

        wx.setStorageSync('shake', isShake == true ? 1 : 0);
    }

    public getShake(): Promise<number | null>{
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return null;
        }

        return new Promise((resolve) => {
            wx.getStorage({
                key: 'shake',
                success (res) {
                    resolve(res.data);
                },
                fail () {
                    console.log('getShake fail');
                    resolve(null);
                }
            });
        });
    }

    /**
     * 设置左右手设置
     * @param handSetting -1:左手  1:右手
     */
    public setHandSetting(handSetting: number): void {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return;
        }

        wx.setStorageSync('hand_setting', handSetting);
    }

    /**
     * 获取左右手设置
     * @returns -1:左手  1:右手  null:未设置
     */
    public getHandSetting(): Promise<number | null> {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            wx.getStorage({
                key: 'hand_setting',
                success (res) {
                    resolve(res.data);
                },
                fail () {
                    console.log('getHandSetting fail');
                    resolve(null);
                }
            });
        });
    }

    public static get instance(): WXManager | null {
        const gameManager = GameManager.getInstance();
        return gameManager?.wxManager ?? null;
    }

    /**
     * 设置音乐开关
     */
    public setMusic(isOn: boolean): void {
        if (typeof (wx) === 'undefined') return;
        wx.setStorageSync('music', isOn ? 1 : 0);
    }

    /**
     * 获取音乐开关
     */
    public getMusic(): Promise<number | null> {
        if (typeof (wx) === 'undefined') return Promise.resolve(null);
        return new Promise((resolve) => {
            wx.getStorage({
                key: 'music',
                success(res) {
                    resolve(res.data);
                },
                fail() {
                    resolve(null);
                }
            });
        });
    }

    /**
     * 设置音效开关
     */
    public setAudio(isOn: boolean): void {
        if (typeof (wx) === 'undefined') return;
        wx.setStorageSync('audio', isOn ? 1 : 0);
    }

    /**
     * 获取音效开关
     */
    public getAudio(): Promise<number | null> {
        if (typeof (wx) === 'undefined') return Promise.resolve(null);
        return new Promise((resolve) => {
            wx.getStorage({
                key: 'audio',
                success(res) {
                    resolve(res.data);
                },
                fail() {
                    resolve(null);
                }
            });
        });
    }

    /**
     * 将像素数据保存到系统相册
     * @param width 纹理宽度
     * @param height 纹理高度
     * @param byteArray 像素数据（RGBA）
     */
    public saveImageToPhotosAlbum(
        width: number,
        height: number,
        byteArray: Uint8Array
    ): void {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return;
        }

        // 创建离屏 canvas
        const canvas = wx.createCanvas();
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d') as any;
        if (!ctx) {
            console.warn('获取 canvas 2d context 失败');
            return;
        }

        // 创建 ImageData 并填充像素数据
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(byteArray);
        ctx.putImageData(imageData, 0, 0);

        // 将 canvas 导出为临时文件路径
        canvas.toTempFilePath({
            x: 0,
            y: 0,
            width,
            height,
            destWidth: width,
            destHeight: height,
            fileType: 'png',
            quality: 1,
            success: (res: any) => {
                console.log('临时图片路径:', res.tempFilePath);
                // 保存到系统相册
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                        console.log('图片已保存到相册');
                    },
                    fail: (err: any) => {
                        console.warn('保存到相册失败:', err);
                        // 用户可能未授权，提示授权
                        if (err.errMsg && err.errMsg.includes('auth deny')) {
                            wx.showModal({
                                title: '提示',
                                content: '需要您授权保存图片到相册，请在设置中开启权限',
                                showCancel: false
                            });
                        }
                    }
                });
            },
            fail: (err: any) => {
                console.warn('导出临时图片失败:', err);
            }
        });
    }

    /**
     * 设置能量
     */
    public setPower(power: number): void {
        if (typeof (wx) === 'undefined') return;
        wx.setStorageSync('power', power);
    }

    /**
     * 获取能量
     */
    public getPower(): Promise<number | null> {
        if (typeof (wx) === 'undefined') return Promise.resolve(null);
        return new Promise((resolve) => {
            wx.getStorage({
                key: 'power',
                success(res) {
                    resolve(res.data);
                },
                fail() {
                    resolve(null);
                }
            });
        });
    }

    /**
     * 设置体力下次恢复时间（时间戳，毫秒）
     */
    public setPowerNextRegenTime(time: number): void {
        if (typeof (wx) === 'undefined') return;
        wx.setStorageSync('power_next_regen', time);
    }

    /**
     * 获取体力下次恢复时间（时间戳，毫秒）
     */
    public getPowerNextRegenTime(): Promise<number | null> {
        if (typeof (wx) === 'undefined') return Promise.resolve(null);
        return new Promise((resolve) => {
            wx.getStorage({
                key: 'power_next_regen',
                success(res) {
                    resolve(res.data);
                },
                fail() {
                    resolve(null);
                }
            });
        });
    }

    public getPowerNextRegenTimeSync(): number {
        if (typeof (wx) === 'undefined') return 0;
        return Math.max(0, Number(wx.getStorageSync('power_next_regen')) || 0);
    }

    // ========== 原生模板广告 ==========
    private customAd: any = null;
    private nativeAdStyle = { left: 0, top: 0, width: 0 };
    // 原生模板广告位 id
    private readonly NATIVE_AD_UNIT_ID: string = 'adunit-e0eab827ac9fbb10';

    private applyNativeAdStyle(): void {
        if (!this.customAd?.style) return;
        this.customAd.style.left = this.nativeAdStyle.left;
        this.customAd.style.top = this.nativeAdStyle.top;
        this.customAd.style.width = this.nativeAdStyle.width;
        this.customAd.style.fixed = true;
    }

    private showNativeAdInternal(): void {
        if (!this.customAd) return;
        this.customAd.show().catch((err: any) => {
            console.warn('原生广告显示失败:', err);
        });
    }

    private getWindowSize(): { width: number; height: number } | null {
        if (typeof (wx) === 'undefined') return null;
        const windowInfo = wx.getWindowInfo?.();
        const width = windowInfo?.windowWidth;
        const height = windowInfo?.windowHeight;
        if (!width || !height) return null;
        return { width, height };
    }

    /**
     * 创建原生模板广告
     * @param left 距离屏幕左侧像素（左上角为原点）
     * @param top 距离屏幕顶部像素（左上角为原点）
     * @param width 广告宽度
     */
    public createNativeAd(left: number, top: number, width: number): void {
        if (typeof (wx) === 'undefined') return;

        this.nativeAdStyle.left = Math.max(0, Math.floor(left));
        this.nativeAdStyle.top = Math.max(0, Math.floor(top));
        this.nativeAdStyle.width = Math.max(1, Math.floor(width));

        try {
            if (!this.customAd) {
                this.customAd = wx.createCustomAd({
                    adUnitId: this.NATIVE_AD_UNIT_ID,
                    style: {
                        left: this.nativeAdStyle.left,
                        top: this.nativeAdStyle.top,
                        width: this.nativeAdStyle.width,
                        fixed: true
                    }
                });

                this.customAd.onLoad(() => {
                    console.log('原生广告加载成功', this.nativeAdStyle);
                    this.applyNativeAdStyle();
                    this.showNativeAdInternal();
                });

                this.customAd.onError((err: any) => {
                    console.warn('原生广告加载失败:', err);
                });

                this.customAd.onClose(() => {
                    console.log('原生广告关闭');
                });
            }
        } catch (e) {
            console.warn('创建原生广告失败:', e);
        }
    }

    /**
     * 在屏幕底部创建原生模板广告
     * @param width 广告宽度，默认铺满窗口宽度
     * @param bottomMargin 距离底部的边距
     * @param estimatedHeight 预估广告高度，用于计算 top
     */
    public createNativeAdAtBottom(bottomMargin: number = 0, estimatedHeight: number = 120): void {
        const windowSize = this.getWindowSize();
        if (!windowSize) return;

        const adWidth = Math.max(1, windowSize.width);
        const left = 0;
        const top = Math.max(0, Math.floor(windowSize.height - estimatedHeight - bottomMargin));
        this.createNativeAd(left, top, adWidth);
    }

    /**
     * 隐藏原生广告
     */
    public hideNativeAd(): void {
        if (!this.customAd) return;
        this.customAd.hide?.();
    }

    /**
     * 显示原生广告（如果未创建会自动创建并显示）
     * @param bottomMargin 距离底部的边距，默认 0
     * @param estimatedHeight 预估广告高度，默认 120
     */
    public showNativeAd(bottomMargin: number = 0, estimatedHeight: number = 120): void {
        if (!this.customAd) {
            this.createNativeAdAtBottom(bottomMargin, estimatedHeight);
            return;
        }
        this.showNativeAdInternal();
    }

    /**
     * 销毁原生广告
     */
    public destroyNativeAd(): void {
        if (this.customAd) {
            this.customAd.destroy();
            this.customAd = null;
        }
    }

    // ========== 原生格子广告 ==========
    private nativeGridAd: any = null;
    private nativeGridAdStyle = { left: 0, top: 0 };
    private readonly NATIVE_GRID_AD_UNIT_ID: string = 'adunit-4873c091df5fa489';

    private showNativeGridAdInternal(): void {
        if (!this.nativeGridAd) return;
        this.nativeGridAd.show().catch((err: any) => {
            console.warn('原生格子广告显示失败:', err);
        });
    }

    /**
     * 创建原生格子广告（贴近屏幕右边）
     * @param right 距离屏幕右侧像素（左上角为原点）
     * @param top 距离屏幕顶部像素（左上角为原点）
     */
    public createNativeGridAd(right: number, top: number): void {
        if (typeof (wx) === 'undefined') return;

        const windowSize = this.getWindowSize();
        if (!windowSize) return;

        // 计算 left 位置使广告贴近屏幕右边
        const adWidth = 56; // 广告宽度
        const left = Math.max(0, Math.floor(windowSize.width - adWidth - right));

        this.nativeGridAdStyle.left = left;
        this.nativeGridAdStyle.top = Math.max(0, Math.floor(top));

        try {
            if (!this.nativeGridAd) {
                this.nativeGridAd = wx.createCustomAd({
                    adUnitId: this.NATIVE_GRID_AD_UNIT_ID,
                    style: {
                        left: this.nativeGridAdStyle.left,
                        top: this.nativeGridAdStyle.top,
                        width: adWidth,
                        fixed: true
                    }
                });

                this.nativeGridAd.onLoad(() => {
                    console.log('原生格子广告加载成功');
                    this.showNativeGridAdInternal();
                });

                this.nativeGridAd.onError((err: any) => {
                    console.warn('原生格子广告加载失败:', err);
                });

                this.nativeGridAd.onClose(() => {
                    console.log('原生格子广告关闭');
                });
            }
        } catch (e) {
            console.warn('创建原生格子广告失败:', e);
        }
    }

    /**
     * 在指定位置创建原生格子广告
     * @param topPercent 距离屏幕顶部的百分比
     */
    public createNativeGridAdAtBottom(topPercent: number): void {
        const windowSize = this.getWindowSize();
        if (!windowSize) return;

        const top = Math.floor(windowSize.height * topPercent);
        this.createNativeGridAd(0, top);
    }

    /**
     * 销毁原生格子广告
     */
    public destroyNativeGridAd(): void {
        if (this.nativeGridAd) {
            this.nativeGridAd.destroy();
            this.nativeGridAd = null;
        }
    }

    /**
     * 显示原生格子广告（如果未创建会自动创建并显示）
     * @param topPercent 距离屏幕顶部的百分比
     */
    public showNativeGridAd(topPercent: number): void {
        if (!this.nativeGridAd) {
            this.createNativeGridAdAtBottom(topPercent);
            return;
        }
        this.showNativeGridAdInternal();
    }

    /**
     * 隐藏原生格子广告
     */
    public hideNativeGridAd(): void {
        if (!this.nativeGridAd) return;
        this.nativeGridAd.hide?.();
    }

    // ========== 登录凭证 ==========

    /**
     * 调用微信登录接口，获取登录凭证（code）
     * 用于换取 openid、session_key 等用户标识
     * @see https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html
     * @returns Promise<{ code: string | null; errMsg: string }>
     */
    public login(): Promise<{ code: string | null; errMsg: string }> {
        return new Promise((resolve) => {
            if (typeof (wx) === 'undefined') {
                console.warn('不在微信小游戏环境中');
                resolve({ code: null, errMsg: 'not in wechat environment' });
                return;
            }

            wx.login({
                success: (res) => {
                    if (res.code) {
                        console.log('wx.login 成功，code:', res.code);
                        resolve({ code: res.code, errMsg: 'ok' });
                    } else {
                        console.warn('wx.login 成功但未返回 code:', res);
                        resolve({ code: null, errMsg: 'no code returned' });
                    }
                },
                fail: (err) => {
                    console.error('wx.login 失败:', err);
                    resolve({ code: null, errMsg: err?.errMsg || 'login failed' });
                }
            });
        });
    }

    /**
     * 检查登录态是否过期
     * 通过 wx.checkSession 检查小程序登录态是否过期
     * @see https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.checkSession.html
     * @returns Promise<boolean> 是否有效
     */
    public checkSession(): Promise<boolean> {
        return new Promise((resolve) => {
            if (typeof (wx) === 'undefined') {
                resolve(false);
                return;
            }

            wx.checkSession({
                success: () => {
                    console.log('session 有效');
                    resolve(true);
                },
                fail: () => {
                    console.log('session 已过期，需要重新登录');
                    resolve(false);
                }
            });
        });
    }

    // ========== 云函数调用 ==========

    /**
     * 获取用户 openid
     * 流程：wx.login -> 云函数 get_openid -> 保存到 storage
     * @returns Promise<string | null> openid
     */
    public async getOpenId(): Promise<string | null> {
        // 先检查本地是否已有缓存
        const cachedOpenid = wx.getStorageSync('openid');
        if (cachedOpenid) {
            console.log('使用缓存的 openid:', cachedOpenid);
            return cachedOpenid;
        }

        // 获取登录凭证
        const loginResult = await this.login();
        if (!loginResult.code) {
            console.warn('获取登录凭证失败:', loginResult.errMsg);
            return null;
        }

        // 调用云函数获取 openid
        const res = await callFunction('get_openid', { js_code: loginResult.code });

        if (res.result?.success && res.result.openid) {
            // 保存到本地缓存
            wx.setStorageSync('openid', res.result.openid);
            console.log('获取 openid 成功:', res.result.openid);
            return res.result.openid;
        }

        console.warn('获取 openid 失败:', res.result?.error);
        return null;
    }

    // ========== 用户信息 ==========

    // 用户昵称缓存
    private _nickname: string = '';
    public get nickname(): string {
        return this._nickname;
    }

    // 用户头像 URL 缓存
    private _avatarUrl: string = '';
    public get avatarUrl(): string {
        return this._avatarUrl;
    }

    /**
     * 检查是否已授权读取用户信息
     */
    public hasUserInfoPermission(): Promise<boolean> {
        return new Promise((resolve) => {
            if (typeof (wx) === 'undefined') {
                GameManager.getInstance()?.setHasUserInfoPermission(false);
                resolve(false);
                return;
            }

            wx.getSetting({
                success: (res) => {
                    const hasPermission = !!res.authSetting?.['scope.userInfo'];
                    GameManager.getInstance()?.setHasUserInfoPermission(hasPermission);
                    resolve(hasPermission);
                },
                fail: (err) => {
                    console.warn('检查用户信息授权失败:', err);
                    GameManager.getInstance()?.setHasUserInfoPermission(false);
                    resolve(false);
                }
            });
        });
    }

    /**
     * 获取用户信息（昵称和头像）
     * 每次都从微信获取最新数据，不使用缓存；拒绝授权时回退为“豆友+openid后四位”
     * @returns Promise<{ nickname: string; avatarUrl: string }>
     */
    public async getUserInfo(): Promise<{ nickname: string; avatarUrl: string }> {
        const resolveFallbackProfile = async (): Promise<{ nickname: string; avatarUrl: string }> => {
            const gameManager = GameManager.getInstance();
            if (gameManager?.hasLoadedUserInfo && (this._nickname.trim() || this._avatarUrl)) {
                return { nickname: this._nickname, avatarUrl: this._avatarUrl };
            }

            const openid = await this.getOpenId();
            const fallbackNickname = openid ? `豆友${openid.slice(-4)}` : '豆友';
            this._nickname = fallbackNickname;
            this._avatarUrl = '';
            gameManager?.setHasLoadedUserInfo(false);
            return { nickname: this._nickname, avatarUrl: this._avatarUrl };
        };

        if (typeof (wx) === 'undefined') {
            return await resolveFallbackProfile();
        }

        return new Promise((resolve) => {
            // 直接调用 wx.getUserInfo 获取最新数据
            wx.getUserInfo({
                withCredentials: false,
                lang: 'zh_CN',
                success: async (res) => {
                    const userInfo = res.userInfo;
                    if (userInfo) {
                        const openid = await this.getOpenId();
                        const fallbackNickname = openid ? `豆友${openid.slice(-4)}` : '豆友';
                        this._nickname = userInfo.nickName?.trim() || fallbackNickname;
                        this._avatarUrl = userInfo.avatarUrl || '';
                        const gameManager = GameManager.getInstance();
                        gameManager?.setHasUserInfoPermission(true);
                        gameManager?.setHasLoadedUserInfo(true);
                        
                        console.log('获取用户信息成功:', this._nickname, this._avatarUrl);
                        resolve({ nickname: this._nickname, avatarUrl: this._avatarUrl });
                        return;
                    }

                    resolve(await resolveFallbackProfile());
                },
                fail: async (err) => {
                    console.warn('获取用户信息失败:', err);
                    resolve(await resolveFallbackProfile());
                }
            });
        });
    }

    private async ensureOpenIdForSubscribe(): Promise<string> {
        const gameManager = GameManager.getInstance();
        const storageOpenid = typeof (wx) === 'undefined' ? '' : (wx.getStorageSync('openid') || '');
        const cachedOpenid = (gameManager?.openid || storageOpenid || '').trim();
        if (cachedOpenid) {
            return cachedOpenid;
        }

        const openid = (await this.getOpenId())?.trim() || '';
        if (openid) {
            gameManager?.setOpenid(openid);
        }
        return openid;
    }

    private getSubscribeMessageSettings(templateIds: string[]): Promise<SubscribeMessageSettingResult> {
        const safeTemplateIds = Array.from(new Set(
            templateIds
                .map((id) => typeof id === 'string' ? id.trim() : '')
                .filter((id) => !!id)
        ));

        return new Promise((resolve) => {
            if (typeof (wx) === 'undefined' || typeof wx.getSetting !== 'function') {
                console.warn('[Subscribe] getSubscribeMessageSettings unavailable', {
                    hasWx: typeof (wx) !== 'undefined',
                    hasGetSetting: typeof (wx) !== 'undefined' && typeof wx.getSetting === 'function'
                });
                resolve({
                    success: false,
                    mainSwitch: null,
                    itemSettings: {},
                    error: 'getSetting is not available'
                });
                return;
            }

            wx.getSetting({
                withSubscriptions: true,
                success: (res) => {
                    console.log('[Subscribe] wx.getSetting success', {
                        mainSwitch: res?.subscriptionsSetting?.mainSwitch,
                        itemSettings: res?.subscriptionsSetting?.itemSettings || {}
                    });
                    const itemSettings: Record<string, SubscribeMessageStatus> = {};
                    const rawItemSettings = res?.subscriptionsSetting?.itemSettings || {};
                    for (const templateId of safeTemplateIds) {
                        const status = typeof rawItemSettings?.[templateId] === 'string' ? rawItemSettings[templateId] : '';
                        itemSettings[templateId] = status as SubscribeMessageStatus;
                    }

                    resolve({
                        success: true,
                        mainSwitch: typeof res?.subscriptionsSetting?.mainSwitch === 'boolean'
                            ? res.subscriptionsSetting.mainSwitch
                            : null,
                        itemSettings
                    });
                },
                fail: (err) => {
                    console.warn('[Subscribe] wx.getSetting failed', err);
                    resolve({
                        success: false,
                        mainSwitch: null,
                        itemSettings: {},
                        error: err?.errMsg || 'getSetting failed'
                    });
                }
            });
        });
    }

    public async requestSubscribeMessage(templateIds: string[]): Promise<RequestSubscribeMessageResult> {
        const safeTemplateIds = Array.from(new Set(
            templateIds
                .map((id) => typeof id === 'string' ? id.trim() : '')
                .filter((id) => !!id)
        ));

        console.log('[Subscribe] requestSubscribeMessage start', {
            templateIds,
            safeTemplateIds
        });

        if (typeof (wx) === 'undefined' || typeof wx.requestSubscribeMessage !== 'function') {
            console.warn('[Subscribe] requestSubscribeMessage unavailable', {
                hasWx: typeof (wx) !== 'undefined',
                hasRequestSubscribeMessage: typeof (wx) !== 'undefined' && typeof wx.requestSubscribeMessage === 'function'
            });
            return {
                success: false,
                result: {},
                error: 'requestSubscribeMessage is not available'
            };
        }

        if (safeTemplateIds.length <= 0) {
            console.warn('[Subscribe] requestSubscribeMessage aborted: empty templateIds');
            return {
                success: false,
                result: {},
                error: 'templateIds is empty'
            };
        }

        console.log('[Subscribe] requestSubscribeMessage invoke immediately to preserve touch interaction');

        return new Promise((resolve) => {
            wx.requestSubscribeMessage({
                tmplIds: safeTemplateIds,
                success: (res) => {
                    const result: Record<string, SubscribeMessageStatus> = {};
                    for (const templateId of safeTemplateIds) {
                        const status = typeof res?.[templateId] === 'string' ? res[templateId] : '';
                        result[templateId] = status as SubscribeMessageStatus;
                    }
                    console.log('[Subscribe] wx.requestSubscribeMessage success', {
                        rawResult: res,
                        result
                    });
                    resolve({
                        success: true,
                        result
                    });

                    void this.getSubscribeMessageSettings(safeTemplateIds).then((settingResult) => {
                        if (settingResult.success) {
                            console.log('[Subscribe] requestSubscribeMessage settings(after request):', {
                                mainSwitch: settingResult.mainSwitch,
                                itemSettings: settingResult.itemSettings
                            });
                        } else {
                            console.warn('[Subscribe] requestSubscribeMessage settings unavailable(after request)', settingResult.error);
                        }
                    });
                },
                fail: (err) => {
                    console.warn('[Subscribe] wx.requestSubscribeMessage failed', err);
                    resolve({
                        success: false,
                        result: {},
                        error: err?.errMsg || 'requestSubscribeMessage failed'
                    });

                    void this.getSubscribeMessageSettings(safeTemplateIds).then((settingResult) => {
                        if (settingResult.success) {
                            console.log('[Subscribe] requestSubscribeMessage settings(after failed request):', {
                                mainSwitch: settingResult.mainSwitch,
                                itemSettings: settingResult.itemSettings
                            });
                        } else {
                            console.warn('[Subscribe] requestSubscribeMessage settings unavailable(after failed request)', settingResult.error);
                        }
                    });
                }
            });
        });
    }

    public async createSubscribeTask(options: CreateSubscribeTaskOptions): Promise<any> {
        const openid = await this.ensureOpenIdForSubscribe();
        if (!openid) {
            console.warn('[Subscribe] createSubscribeTask aborted: missing openid');
            return {
                success: false,
                error: 'openid is required'
            };
        }

        const templateId = options.templateId?.trim() || '';
        if (!templateId) {
            console.warn('[Subscribe] createSubscribeTask aborted: missing templateId');
            return {
                success: false,
                error: 'templateId is required'
            };
        }

        if (!options.payload || typeof options.payload !== 'object' || Array.isArray(options.payload)) {
            console.warn('[Subscribe] createSubscribeTask aborted: invalid payload', options.payload);
            return {
                success: false,
                error: 'payload is required'
            };
        }

        console.log('[Subscribe] createSubscribeTask request', {
            openid,
            templateId,
            page: options.page?.trim() || '',
            sendAt: Number(options.sendAt) || Date.now(),
            scene: options.scene?.trim() || '',
            dedupeKey: options.dedupeKey?.trim() || '',
            payload: options.payload
        });

        const result = await callFunction('create_subscribe_task', {
            openid,
            templateId,
            page: options.page?.trim() || '',
            payload: options.payload,
            sendAt: Number(options.sendAt) || Date.now(),
            scene: options.scene?.trim() || '',
            miniprogramState: options.miniprogramState || 'formal',
            dedupeKey: options.dedupeKey?.trim() || ''
        });

        console.log('[Subscribe] createSubscribeTask response', result?.result ?? result);

        return result?.result ?? result;
    }

    public async requestAndCreateSubscribeTask(options: CreateSubscribeTaskOptions): Promise<SubscribeTaskClientResult> {
        const templateId = options.templateId?.trim() || '';
        if (!templateId) {
            console.warn('[Subscribe] requestAndCreateSubscribeTask aborted: missing templateId');
            return {
                success: false,
                error: 'templateId is required'
            };
        }

        console.log('[Subscribe] requestAndCreateSubscribeTask start', {
            templateId,
            sendAt: options.sendAt,
            page: options.page?.trim() || '',
            scene: options.scene?.trim() || '',
            dedupeKey: options.dedupeKey?.trim() || ''
        });

        const subscribeRes = await this.requestSubscribeMessage([templateId]);
        if (!subscribeRes.success) {
            console.warn('[Subscribe] requestAndCreateSubscribeTask aborted: subscribe request failed', subscribeRes);
            return {
                success: false,
                subscribeResult: subscribeRes.result,
                error: subscribeRes.error || 'requestSubscribeMessage failed'
            };
        }

        const subscribeStatus = subscribeRes.result[templateId] || '';
        if (subscribeStatus !== 'accept') {
            console.warn('[Subscribe] requestAndCreateSubscribeTask aborted: subscribe not accepted', {
                templateId,
                subscribeStatus,
                subscribeResult: subscribeRes.result
            });
            return {
                success: false,
                subscribeStatus,
                subscribeResult: subscribeRes.result,
                error: `subscribe status is ${subscribeStatus || 'unknown'}`
            };
        }

        const taskResult = await this.createSubscribeTask(options);
        if (!taskResult?.success) {
            console.warn('[Subscribe] requestAndCreateSubscribeTask aborted: create task failed', taskResult);
            return {
                success: false,
                subscribeStatus,
                subscribeResult: subscribeRes.result,
                taskResult,
                error: taskResult?.error || 'create subscribe task failed'
            };
        }

        return {
            success: true,
            subscribeStatus,
            subscribeResult: subscribeRes.result,
            taskResult,
            duplicated: !!taskResult?.duplicated,
            taskId: taskResult?.taskId || ''
        };
    }

    public async requestPowerRegenSubscribe(source: string = 'manual'): Promise<SubscribeTaskClientResult> {
        const templateId = this.subscribeTemplateId?.trim() || '';
        const gameManager = GameManager.getInstance();

        console.log('[Subscribe] requestPowerRegenSubscribe start', {
            source,
            templateId,
            subscribePage: this.subscribePage?.trim() || '',
            subscribeTipField: this.subscribeTipField?.trim() || '',
            subscribeCurrentPowerField: this.subscribeCurrentPowerField?.trim() || '',
            currentPower: gameManager?.power,
            openid: gameManager?.openid || ''
        });

        if (!templateId) {
            console.warn('[Subscribe] requestPowerRegenSubscribe aborted: subscribeTemplateId is empty');
            return {
                success: false,
                error: 'subscribeTemplateId is empty'
            };
        }

        if (!gameManager || gameManager.power >= 10) {
            console.warn('[Subscribe] requestPowerRegenSubscribe aborted: power is already full or gameManager missing', {
                hasGameManager: !!gameManager,
                power: gameManager?.power
            });
            return {
                success: false,
                error: 'power is already full'
            };
        }

        const sendAt = this.getPowerNextRegenTimeSync();
        console.log('[Subscribe] requestPowerRegenSubscribe power_next_regen', {
            sendAt,
            now: Date.now()
        });
        if (sendAt <= Date.now()) {
            console.warn('[Subscribe] requestPowerRegenSubscribe aborted: power regen time is invalid', {
                sendAt,
                now: Date.now()
            });
            return {
                success: false,
                error: 'power regen time is invalid'
            };
        }

        const tipField = this.subscribeTipField?.trim() || 'thing2';
        const currentPowerField = this.subscribeCurrentPowerField?.trim() || 'character_string5';
        const nextPower = Math.min(gameManager.power + 1, 10);
        const payload: Record<string, any> = {
            [currentPowerField]: { value: `${nextPower}/10` },
            [tipField]: { value: '体力已恢复，记得回来闯关欧~' }
        };

        console.log('[Subscribe] requestPowerRegenSubscribe payload ready', {
            nextPower,
            payload
        });

        const result = await this.requestAndCreateSubscribeTask({
            templateId,
            page: this.subscribePage?.trim() || '',
            payload,
            sendAt,
            scene: `power_regen_${source}`,
            dedupeKey: `power_regen_${sendAt}`
        });

        console.log('[Subscribe] requestPowerRegenSubscribe result', result);
        return result;
    }
}
