import { _decorator, Component, Node } from 'cc';
import { GameManager, DifficultyMode } from './GameManager';
const { ccclass, property } = _decorator;

// 微信小游戏全局对象类型声明
declare const wx: any;

// ========== 静态初始化：模块加载时立即执行，比所有组件实例都早 ==========
// if (typeof wx !== 'undefined' && wx.cloud) {
//     wx.cloud.init({
//         env: 'cloud1-2gltl8c72b1bc894'
//     });
// }

/**
 * 云存储管理器
 * 接入微信小游戏 wx.setUserCloudStorage 接口
 */
@ccclass('WXManager')
export class WXManager extends Component {

    @property({ type: Node })
    testBtn: Node = null;

    // 激励视频广告实例
    private skillRewardedVideoAd: any = null;
    private powerRewardedVideoAd: any = null;
    private interstitialAd: any = null;
    // 激励视频广告位 id（在微信公众平台广告位配置获取）
    private readonly SKILL_VIDEO_AD_UNIT_ID: string = 'adunit-f7349bec4122701f';
    private readonly POWER_VIDEO_AD_UNIT_ID: string = 'adunit-cdd79ed40eb8ec5f';
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

    // ========== 激励视频广告（技能） ==========
    private skillRewardedVideoClosed: ((success: boolean) => void) | null = null;

    /**
     * 创建技能激励视频广告
     */
    private createSkillRewardedVideoAd(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            this.skillRewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: this.SKILL_VIDEO_AD_UNIT_ID
            });

            this.skillRewardedVideoAd.onLoad(() => {
                console.log('技能激励视频广告加载完成');
            });

            this.skillRewardedVideoAd.onError((err: any) => {
                console.warn('技能激励视频广告错误:', err);
            });

            this.skillRewardedVideoAd.onClose((res: any) => {
                if (res && res.isEnded) {
                    console.log('技能激励视频广告播放完成，发放奖励');
                    this.skillRewardedVideoClosed?.(true);
                } else {
                    console.log('技能激励视频广告未看完，不发放奖励');
                    this.skillRewardedVideoClosed?.(false);
                }
                this.skillRewardedVideoClosed = null;
            });
        } catch (e) {
            console.warn('创建技能激励视频广告失败:', e);
        }
    }

    /**
     * 显示技能激励视频广告
     * @param callback 播放结束后的回调，参数表示是否完整看完
     */
    public showSkillRewardedVideoAd(callback: (success: boolean) => void): void {
        if (typeof (wx) === 'undefined') {
            callback?.(true);
            return;
        }

        if (this.isDebugMode) {
            callback?.(true);
            return;
        }

        if (!this.skillRewardedVideoAd) {
            console.warn('技能激励视频广告未创建');
            callback?.(false);
            return;
        }

        this.skillRewardedVideoClosed = callback;

        this.skillRewardedVideoAd.show().then(() => {
            console.log('技能激励视频广告显示成功');
        }).catch((err: any) => {
            this.skillRewardedVideoAd.load().then(() => {
                return this.skillRewardedVideoAd.show();
            }).catch(() => {
                this.skillRewardedVideoClosed?.(false);
                this.skillRewardedVideoClosed = null;
            });
        });
    }

    // ========== 激励视频广告（体力） ==========
    private powerRewardedVideoClosed: ((success: boolean) => void) | null = null;

    /**
     * 创建体力激励视频广告
     */
    private createPowerRewardedVideoAd(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            this.powerRewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: this.POWER_VIDEO_AD_UNIT_ID
            });

            this.powerRewardedVideoAd.onLoad(() => {
                console.log('体力激励视频广告加载完成');
            });

            this.powerRewardedVideoAd.onError((err: any) => {
                console.warn('体力激励视频广告错误:', err);
            });

            this.powerRewardedVideoAd.onClose((res: any) => {
                if (res && res.isEnded) {
                    console.log('体力激励视频广告播放完成，发放奖励');
                    this.powerRewardedVideoClosed?.(true);
                } else {
                    console.log('体力激励视频广告未看完，不发放奖励');
                    this.powerRewardedVideoClosed?.(false);
                }
                this.powerRewardedVideoClosed = null;
            });
        } catch (e) {
            console.warn('创建体力激励视频广告失败:', e);
        }
    }

    /**
     * 显示体力激励视频广告
     * @param callback 播放结束后的回调，参数表示是否完整看完
     */
    public showPowerRewardedVideoAd(callback: (success: boolean) => void): void {
        if (typeof (wx) === 'undefined') {
            callback?.(true);
            return;
        }

        if (this.isDebugMode) {
            callback?.(true);
            return;
        }

        if (!this.powerRewardedVideoAd) {
            console.warn('体力激励视频广告未创建');
            callback?.(false);
            return;
        }

        this.powerRewardedVideoClosed = callback;

        this.powerRewardedVideoAd.show().then(() => {
            console.log('体力激励视频广告显示成功');
        }).catch((err: any) => {
            this.powerRewardedVideoAd.load().then(() => {
                return this.powerRewardedVideoAd.show();
            }).catch(() => {
                this.powerRewardedVideoClosed?.(false);
                this.powerRewardedVideoClosed = null;
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
     * 创建激励视频广告（兼容旧调用）
     */
    private createRewardedVideoAd(): void {
        this.createSkillRewardedVideoAd();
        this.createPowerRewardedVideoAd();
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

    /**
     * 获取用户 openid 并保存
     */
    // private async getOpenid(): Promise<void> {
    //     if (typeof (wx) === 'undefined') return;

    //     try {
    //         // wx.login 获取 code
    //         const loginRes: any = await wx.login();
    //         if (!loginRes.code) {
    //             console.warn('wx.login 未返回 code');
    //             return;
    //         }

    //         console.log('code:', loginRes.code);
    //         // 发送 code 到云函数换取 openid
    //         const res: any = await wx.cloud.callFunction({
    //             name: 'login',
    //             data: { code: loginRes.code }
    //         });

    //         this.openid = res?.openid ?? '';
    //         if (this.openid) {
    //             console.log('获取到 openid:', this.openid);
    //         } else {
    //             console.warn('未获取到 openid');
    //         }
    //     } catch (e) {
    //         console.warn('获取 openid 失败:', e);
    //     }
    // }

    /**
     * 提交关卡进度
     * @param level 当前关卡数
     */
    // public async submitLevel(level: number): Promise<void> {
    //     if (typeof (wx) === 'undefined') {
    //         console.warn('不在微信小游戏环境中');
    //         return null;
    //     }

    //     return new Promise((resolve) => {
    //         const db = wx.cloud.database();

    //         db.collection('BeanSplicing').get().then(res => {
    //             const data = res.data;
    //             if(data.length > 0){
    //                 db.collection("BeanSplicing").doc(data[0]._id).update({
    //                     data: {
    //                         level: level
    //                     }
    //                 });
    //             }else{
    //                 db.collection("BeanSplicing").add({
    //                     data: {
    //                         level: level
    //                     }
    //                 });
    //             }
    //             wx.setStorageSync('level', level);
    //         });

    //         resolve(null);
    //     });
    // }

    /**
     * 从云端获取关卡数
     * @returns 返回保存的关卡数，不存在则返回 null
     */
    // public async getLevel(): Promise<number | null> {
    //     // 检查是否在微信环境
    //     if (typeof (wx) === 'undefined') {
    //         console.warn('不在微信小游戏环境中，返回默认关卡数');
    //         return null;
    //     }

    //     return new Promise((resolve) => {
    //         const db = wx.cloud.database()
    //         db.collection('BeanSplicing').
    //         field({
    //             level: true,
    //         })
    //         .get().then(res => {
    //             const data = res.data;
    //             if(data.length <= 0){
    //                 resolve(null);
    //             }else{
    //                 resolve(data[0].level);
    //             }
    //         });
    //     });
    // }

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

    // ========== 原生模板广告 ==========
    private customAd: any = null;
    private nativeAdStyle = { left: 0, top: 0, width: 0 };
    // 原生模板广告位 id
    private readonly NATIVE_AD_UNIT_ID: string = 'adunit-e0eab827ac9fbb10'; // 替换为实际的广告位 id

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
                return;
            }

            this.applyNativeAdStyle();
            this.customAd.show().catch(() => {
                this.customAd.destroy();
                this.customAd = null;
                this.createNativeAd(this.nativeAdStyle.left, this.nativeAdStyle.top, this.nativeAdStyle.width);
            });
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
     * 显示原生广告
     */
    public showNativeAd(): void {
        if (!this.customAd) return;
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
}
