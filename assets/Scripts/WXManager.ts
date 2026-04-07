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
    private rewardedVideoAd: any = null;
    // 激励视频广告位 id（在微信公众平台广告位配置获取）
    private readonly REWARDED_VIDEO_AD_UNIT_ID: string = 'adunit-f7349bec4122701f';
    // 是否为调试模式（正式版但广告位为 test123 时启用）
    private isDebugMode: boolean = false;

    // 分享图片 ID（在微信公众平台「增长入口」→「小程序分享图」上传获取）
    private _imageUrlId: string = 'qGwwwryFRtmUgxcDjf2p3w==';
    // 分享图片 URL（必须 HTTPS）
    private _imageUrl: string = 'https://mmocgame.qpic.cn/wechatgame/f4uuDhnRAxMTJF1dLAUnqlLAKiaIMZfsk7uHGIUribuCc8ibicOmTxAVDvvG6LMQLTMb/0';

    onLoad() {
        this.checkEnvironment();
        this.showShareMenu();
        // imageUrlId、imageUrl：在微信公众平台「增长入口」→「小程序分享图」上传后获得的图片 ID 和图片 URL
        this.onShareAppMessage('快来和我一起拼豆！');
        if (!this.isDebugMode) {
            this.createRewardedVideoAd();
        }
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

    /**
     * 检查运行环境：开发版/体验版/正式版
     */
    private checkEnvironment(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            // envVersion: 'develop' | 'trial' | 'release'
            const accountInfo = wx.getAccountInfoSync();
            const env = accountInfo?.miniProgram?.envVersion;
            if (env === 'release' && this.REWARDED_VIDEO_AD_UNIT_ID === 'test123') {
                this.isDebugMode = true;
            } else {
                this.isDebugMode = false;
            }
            console.log(`当前环境: ${env}`);
        } catch (e) {
            console.warn('获取运行环境信息失败:', e);
        }
    }

    /**
     * 创建激励视频广告
     */
    private createRewardedVideoAd(): void {
        if (typeof (wx) === 'undefined') return;

        try {
            this.rewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: this.REWARDED_VIDEO_AD_UNIT_ID
            });

            // 监听加载完成
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频广告加载完成');
            });

            // 监听错误
            this.rewardedVideoAd.onError((err: any) => {
                console.warn('激励视频广告错误:', err);
            });

            // 监听关闭（用户主动关闭广告）
            this.rewardedVideoAd.onClose((res: any) => {
                // res.isEnded 表示用户是否看完广告
                if (res && res.isEnded) {
                    console.log('激励视频广告播放完成，发放奖励');
                    this.onRewardedVideoClosed?.(true);
                } else {
                    console.log('激励视频广告未看完，不发放奖励');
                    this.onRewardedVideoClosed?.(false);
                }
                this.onRewardedVideoClosed = null;
            });
        } catch (e) {
            console.warn('创建激励视频广告失败:', e);
        }
    }

    // 激励视频回调
    private onRewardedVideoClosed: ((success: boolean) => void) | null = null;

    /**
     * 显示激励视频广告
     * @param callback 播放结束后的回调，参数表示是否完整看完
     */
    public showRewardedVideoAd(callback: (success: boolean) => void): void {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中，模拟激励视频');
            callback?.(true);
            return;
        }

        // 调试模式：直接返回成功，跳过广告
        if (this.isDebugMode) {
            console.log('调试模式：跳过广告，直接执行技能');
            callback?.(true);
            return;
        }

        if (!this.rewardedVideoAd) {
            console.warn('激励视频广告未创建');
            callback?.(false);
            return;
        }

        this.onRewardedVideoClosed = callback;

        this.rewardedVideoAd.show().then(() => {
            console.log('激励视频广告显示成功');
        }).catch((err: any) => {
            // 广告可能未加载，先加载再显示
            console.warn('激励视频广告显示失败，尝试加载:', err);
            this.rewardedVideoAd.load().then(() => {
                console.log('激励视频广告重新加载成功');
                return this.rewardedVideoAd.show();
            }).then(() => {
                console.log('激励视频广告重新显示成功');
            }).catch((loadErr: any) => {
                console.warn('激励视频广告加载失败:', loadErr);
                this.onRewardedVideoClosed?.(false);
                this.onRewardedVideoClosed = null;
            });
        });
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
     * 设置体力值
     */
    public setPower(power: number): void {
        if (typeof (wx) === 'undefined') return;
        wx.setStorageSync('power', power);
    }

    /**
     * 获取体力值
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
}
