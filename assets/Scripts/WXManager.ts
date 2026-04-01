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

    onLoad() {
        this.checkEnvironment();
        if (!this.isDebugMode) {
            this.createRewardedVideoAd();
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
}
