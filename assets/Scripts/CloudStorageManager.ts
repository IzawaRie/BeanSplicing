import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

// 微信小游戏全局对象类型声明
declare const wx: any;

/**
 * 云存储管理器
 * 接入微信小游戏 wx.setUserCloudStorage 接口
 */
@ccclass('CloudStorageManager')
export class CloudStorageManager extends Component {

    // KVData 列表
    private _kvDataList: { key: string; value: string }[] = [];

    start(){
        this.printSystemInfo();
    }

    /**
     * 保存用户数据到云端
     * @param key 数据键名
     * @param value 数据值
     */
    public setData(key: string, value: string): void {
        // 查找是否已存在该键
        const index = this._kvDataList.findIndex(item => item.key === key);
        if (index >= 0) {
            this._kvDataList[index].value = value;
        } else {
            this._kvDataList.push({ key, value });
        }
    }

    /**
     * 提交数据到微信云存储
     */
    public async commit(): Promise<void> {
        // 检查是否在微信环境
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中，跳过云存储提交');
            return;
        }

        return new Promise((resolve, reject) => {
            wx.setUserCloudStorage({
                KVDataList: this._kvDataList,
                success: () => {
                    console.log('云存储提交成功');
                    resolve();
                },
                fail: (err) => {
                    console.error('云存储提交失败:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 提交关卡进度
     * @param level 当前关卡数
     */
    public async submitLevel(level: number): Promise<void> {
        this.setData('level', level.toString());
        await this.commit();
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

        // 检查 API 是否可用
        if (typeof wx.getUserCloudStorage !== 'function') {
            console.warn('wx.getUserCloudStorage 不可用，跳过云存储获取');
            return null;
        }

        return new Promise((resolve) => {
            wx.getUserCloudStorage({
                keyList: ['level'],
                success: (res: any) => {
                    if (res.KVDataList && res.KVDataList.length > 0) {
                        const levelData = res.KVDataList.find((item: any) => item.key === 'level');
                        if (levelData && levelData.value) {
                            const level = parseInt(levelData.value, 10);
                            if (!isNaN(level)) {
                                console.log('从云端获取关卡数:', level);
                                resolve(level);
                                return;
                            }
                        }
                    }
                    console.log('云端无保存的关卡数');
                    resolve(null);
                },
                fail: (err: any) => {
                    console.warn('获取云存储失败:', err);
                    resolve(null);
                }
            });
        });
    }

    /**
     * 打印系统信息
     */
    public printSystemInfo(): void {
        // 检查是否在微信环境
        if (typeof (wx) === 'undefined') {
            console.warn('不在微信小游戏环境中');
            return;
        }

        // 检查 API 是否可用
        if (typeof wx.getSystemInfoSync !== 'function') {
            console.warn('wx.getSystemInfoSync 不可用');
            return;
        }

        const info = wx.getSystemInfoSync();
        console.log('=== 系统信息 ===');
        console.log('brand:', info.brand);
        console.log('model:', info.model);
        console.log('pixelRatio:', info.pixelRatio);
        console.log('screenWidth:', info.screenWidth);
        console.log('screenHeight:', info.screenHeight);
        console.log('windowWidth:', info.windowWidth);
        console.log('windowHeight:', info.windowHeight);
        console.log('language:', info.language);
        console.log('version:', info.version);
        console.log('system:', info.system);
        console.log('platform:', info.platform);
        console.log('SDKVersion:', info.SDKVersion);
        console.log('benchmarkLevel:', info.benchmarkLevel);
        console.log('================');
    }
}
