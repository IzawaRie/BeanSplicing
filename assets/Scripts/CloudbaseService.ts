// 微信小游戏全局对象类型声明
declare const wx: any;

// 初始化云开发环境
if (typeof wx !== 'undefined' && wx.cloud) {
    wx.cloud.init({
        env: 'cloud1-2gltl8c72b1bc894',
        traceUser: true
    });
}

/**
 * 数据库查询条件
 */
export interface QueryCondition {
    /** 查询条件 */
    where?: Record<string, any>;
    /** 排序字段，传入字段名，正序 */
    orderBy?: string;
    /** 排序字段，倒序 */
    orderByDesc?: string;
    /** 返回记录数量 */
    limit?: number;
    /** 跳过记录数量（用于分页） */
    skip?: number;
}

/**
 * 云开发数据库服务
 * 使用微信小游戏原生 API 操作云数据库
 */
export class CloudbaseDBService {
    private static _instance: CloudbaseDBService = null;
    public static getInstance(): CloudbaseDBService {
        if (!CloudbaseDBService._instance) {
            CloudbaseDBService._instance = new CloudbaseDBService();
        }
        return CloudbaseDBService._instance;
    }

    /**
     * 获取数据库实例
     */
    private getDB() {
        if (typeof (wx) === 'undefined' || !wx.cloud) {
            console.warn('不在微信小游戏环境中');
            return null;
        }
        return wx.cloud.database();
    }

    /**
     * 查询记录列表
     */
    query<T = any>(collectionName: string, condition: QueryCondition = {}): Promise<T[]> {
        const db = this.getDB();
        if (!db) return Promise.resolve([]);

        let query: any = db.collection(collectionName);

        if (condition.where) {
            query = query.where(condition.where);
        }

        if (condition.orderByDesc) {
            query = query.orderBy(condition.orderByDesc, 'desc');
        } else if (condition.orderBy) {
            query = query.orderBy(condition.orderBy, 'asc');
        }

        if (condition.skip) {
            query = query.skip(condition.skip);
        }
        if (condition.limit) {
            query = query.limit(condition.limit);
        }

        return query.get().then(res => {
            console.log(`查询 ${collectionName} 成功，数量：${res.data.length}`);
            return res.data as T[];
        }).catch(error => {
            console.error(`查询 ${collectionName} 失败：`, error);
            return [];
        });
    }

    /**
     * 根据ID查询单条记录
     */
    getById<T = any>(collectionName: string, docId: string): Promise<T | null> {
        const db = this.getDB();
        if (!db) return Promise.resolve(null);

        return db.collection(collectionName).doc(docId).get().then(res => {
            if (res.data) {
                return res.data as T;
            }
            return null;
        }).catch(error => {
            return null;
        });
    }

    /**
     * 新增记录（自动生成ID）
     */
    add(collectionName: string, data: Record<string, any>): Promise<string | null> {
        const db = this.getDB();
        if (!db) return Promise.resolve(null);

        return db.collection(collectionName).add({
            data: data
        }).then(res => {
            console.log(`新增 ${collectionName} 成功，ID：${res._id}`);
            return String(res._id);
        }).catch(error => {
            console.error(`新增 ${collectionName} 失败：`, error);
            return null;
        });
    }

    /**
     * 更新记录（只更新指定字段）
     */
    update(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
        const db = this.getDB();
        if (!db) return Promise.resolve(false);

        // 排除 _id 字段
        const { _id, ...updateData } = data;

        return db.collection(collectionName).doc(docId).update({
            data: updateData
        }).then(res => {
            console.log(`更新 ${collectionName}/${docId} 成功，更新了 ${res.stats.updated} 条`);
            return true;
        }).catch(error => {
            console.error(`更新 ${collectionName}/${docId} 失败：`, error);
            return false;
        });
    }

    /**
     * 删除记录
     */
    delete(collectionName: string, docId: string): Promise<boolean> {
        const db = this.getDB();
        if (!db) return Promise.resolve(false);

        return db.collection(collectionName).doc(docId).remove().then(res => {
            console.log(`删除 ${collectionName}/${docId} 成功，删除了 ${res.stats.removed} 条`);
            return true;
        }).catch(error => {
            console.error(`删除 ${collectionName}/${docId} 失败：`, error);
            return false;
        });
    }

    /**
     * 根据条件删除记录
     */
    deleteWhere(collectionName: string, where: Record<string, any>): Promise<number> {
        const db = this.getDB();
        if (!db) return Promise.resolve(0);

        return db.collection(collectionName).where(where).remove().then(res => {
            console.log(`删除 ${collectionName} 符合条件的记录，数量：${res.stats.removed}`);
            return res.stats.removed || 0;
        }).catch(error => {
            console.error(`删除 ${collectionName} 失败：`, error);
            return 0;
        });
    }

    /**
     * upsert 操作：直接使用 set，如果不存在则新增，存在则替换
     */
    upsert(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
        const db = this.getDB();
        if (!db) return Promise.resolve(false);
        
        // 排除 _id 字段（docId 已经通过 doc() 指定）
        const { _id, ...updateData } = data;
        
        return db.collection(collectionName).doc(docId).set({
            data: updateData
        }).then(res => {
            console.log(`upsert ${collectionName}/${docId} 成功, stats:`, res.stats);
            return true;
        }).catch(error => {
            console.error(`upsert ${collectionName}/${docId} 失败：`, error);
            return false;
        });
    }

    /**
     * 分页查询
     */
    queryByPage<T = any>(
        collectionName: string,
        page: number = 1,
        pageSize: number = 10,
        where: Record<string, any> = {},
        orderBy?: string,
        orderByDesc: boolean = false
    ): Promise<{
        data: T[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const db = this.getDB();
        if (!db) return Promise.resolve({ data: [], total: 0, page, pageSize, totalPages: 0 });

        let query: any = db.collection(collectionName);

        if (Object.keys(where).length > 0) {
            query = query.where(where);
        }

        if (orderBy) {
            query = query.orderBy(orderBy, orderByDesc ? 'desc' : 'asc');
        }

        const skip = (page - 1) * pageSize;

        let countQuery: any = db.collection(collectionName);
        if (Object.keys(where).length > 0) {
            countQuery = countQuery.where(where);
        }

        return Promise.all([
            query.skip(skip).limit(pageSize).get(),
            countQuery.count()
        ]).then(([dataRes, countRes]) => {
            const total = countRes.total;
            const totalPages = Math.ceil(total / pageSize);
            return {
                data: dataRes.data as T[],
                total,
                page,
                pageSize,
                totalPages
            };
        }).catch(error => {
            console.error(`分页查询 ${collectionName} 失败：`, error);
            return { data: [], total: 0, page, pageSize, totalPages: 0 };
        });
    }

    /**
     * 批量新增
     */
    batchAdd(collectionName: string, dataArray: Record<string, any>[]): Promise<string[]> {
        const promises = dataArray.map(data => this.add(collectionName, data));
        return Promise.all(promises).then(ids => {
            return ids.filter(id => id !== null) as string[];
        });
    }
}

export default CloudbaseDBService.getInstance();

/**
 * 调用云函数
 */
export function callFunction(name: string, data: Record<string, any> = {}): Promise<any> {
    if (typeof (wx) === 'undefined' || !wx.cloud) {
        console.warn('不在微信小游戏环境中或 wx.cloud 不可用');
        return Promise.resolve({ result: { success: false, error: 'not in wechat environment' } });
    }

    return wx.cloud.callFunction({
        name: name,
        data: data
    }).then(res => {
        console.log(`云函数 ${name} 返回成功`);
        return res;
    }).catch(error => {
        console.error(`调用云函数 ${name} 失败:`, error);
        return { result: { success: false, error: error.message || error.errMsg } };
    });
}
