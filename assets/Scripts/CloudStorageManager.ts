import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

// 微信小游戏全局对象类型声明
declare const wx: any;

// ========== 静态初始化：模块加载时立即执行，比所有组件实例都早 ==========
if (typeof wx !== 'undefined' && wx.cloud) {
    wx.cloud.init({
        env: 'cloud1-2gltl8c72b1bc894'
    });
}

/**
 * 云存储管理器
 * 接入微信小游戏 wx.setUserCloudStorage 接口
 */
@ccclass('CloudStorageManager')
export class CloudStorageManager extends Component {
    //用户 openid
    //public openid: string = '';

    onLoad() {
    }

    start() {
        //this.getOpenid();
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
    public async submitLevel(level: number): Promise<void> {
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return null;
        }

        return new Promise((resolve) => {
            const db = wx.cloud.database();

            db.collection('BeanSplicing').get().then(res => {
                const data = res.data;
                if(data.length > 0){
                    db.collection("BeanSplicing").doc(data[0]._id).update({
                        data: {
                            level: level
                        }
                    });
                }else{
                    db.collection("BeanSplicing").add({
                        data: {
                            level: level
                        }
                    });
                }
            });

            resolve(null);
        });
    }

    /**
     * 从云端获取关卡数
     * @returns 返回保存的关卡数，不存在则返回 null
     */
    public async getLevel(): Promise<number | null> {
        // 检查是否在微信环境
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中，返回默认关卡数');
            return null;
        }

        return new Promise((resolve) => {
            const db = wx.cloud.database()
            db.collection('BeanSplicing').
            field({
                level: true,
            })
            .get().then(res => {
                const data = res.data;
                if(data.length <= 0){
                    resolve(null);
                }else{
                    resolve(data[0].level);
                }
            });
        });
    }
}
