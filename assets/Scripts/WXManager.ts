import { _decorator, Component, Node } from 'cc';
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

    //用户 openid
    //public openid: string = '';

    onLoad() {
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
     * 清除关卡缓存
     */
    public clearStorageLevel(): void {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return;
        }

        wx.removeStorageSync('level');
        console.log('已清除关卡缓存');
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


}
