import cloudbaseSDK from "@cloudbase/js-sdk";
import adapter from "@cloudbase/adapter-cocos_native";

// 注册适配器
cloudbaseSDK.useAdapters(adapter);

const cloudbase = cloudbaseSDK.init({
  // 环境 ID
  env: "cloud1-2gltl8c72b1bc894",
  // 地域
  region: "ap-shanghai",
  // 匿名访问令牌
  accessKey: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2Nsb3VkMS0yZ2x0bDhjNzJiMWJjODk0LmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJjbG91ZDEtMmdsdGw4YzcyYjFiYzg5NCIsImV4cCI6NDA3ODA0MTAwOCwiaWF0IjoxNzc0MzU3ODA4LCJub25jZSI6IkY3V09YSHdCUXMtOHV5MDZrcmpCN2ciLCJhdF9oYXNoIjoiRjdXT1hId0JRcy04dXkwNmtyakI3ZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJjbG91ZDEtMmdsdGw4YzcyYjFiYzg5NCIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.iMFh_YL12bd3QgTew2I0GcrqDxAOdSarrfb5FcVyctjyL-Iay3ywusmKMKyMMl_4CSOrXypEB6bRVaMUHnwUoxIJ428P0pRar2MmYWKy8QdKSKa-hCQWOcUm5Ak4YW-9ySMBEp6aXKYvumZcfcKMTKQNnpnEWXvaQewWiLk4imISVjYthp8NlMzO-3bSNEIL3EueUlyaoRFgxtH6tUElUOjKPo7x4BKYRhsWISwaPqary4lY5wVMn8e1L6R587ld-Q0ZSWbKGgfNbd65MwN465oxbZu1PtQWng-ff5C_F52BKwKUg5rFtDGgQZD1OItnVUMnHTSjLVRtbRRkieqdvw"
});

// 导出 cloudbase 实例供外部使用
export { cloudbase };

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
 * 数据库服务
 * 提供通用的增删改查操作
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
        return (cloudbase as any).database();
    }

    /**
     * 查询记录
     * @param collectionName 集合名称
     * @param condition 查询条件
     * @returns 查询结果数组
     */
    async query<T = any>(collectionName: string, condition: QueryCondition = {}): Promise<T[]> {
        try {
            const db = this.getDB();
            let query: any = db.collection(collectionName);

            // 添加 where 条件
            if (condition.where) {
                query = query.where(condition.where);
            }

            // 添加排序
            if (condition.orderByDesc) {
                query = query.orderBy(condition.orderByDesc, 'desc');
            } else if (condition.orderBy) {
                query = query.orderBy(condition.orderBy, 'asc');
            }

            // 添加分页
            if (condition.skip) {
                query = query.skip(condition.skip);
            }
            if (condition.limit) {
                query = query.limit(condition.limit);
            }

            const res = await query.get();
            console.log(`查询 ${collectionName} 成功，数量：${res.data.length}`);
            return res.data as T[];
        } catch (error) {
            console.error(`查询 ${collectionName} 失败：`, error);
            return [];
        }
    }

    /**
     * 根据ID查询单条记录
     * @param collectionName 集合名称
     * @param docId 文档ID
     * @returns 查询结果，未找到返回null
     */
    async getById<T = any>(collectionName: string, docId: string): Promise<T | null> {
        try {
            const db = this.getDB();
            const res = await db.collection(collectionName).doc(docId).get();
            
            if (res.data && res.data.length > 0) {
                return res.data[0] as T;
            }
            return null;
        } catch (error) {
            console.error(`获取 ${collectionName}/${docId} 失败：`, error);
            return null;
        }
    }

    /**
     * 新增记录
     * @param collectionName 集合名称
     * @param data 要新增的数据
     * @returns 新增的文档ID，失败返回null
     */
    async add(collectionName: string, data: Record<string, any>): Promise<string | null> {
        try {
            const db = this.getDB();
            const res = await db.collection(collectionName).add(data);
            
            console.log(`新增 ${collectionName} 成功，ID：${res.id}`);
            return res.id;
        } catch (error) {
            console.error(`新增 ${collectionName} 失败：`, error);
            return null;
        }
    }

    /**
     * 更新记录
     * @param collectionName 集合名称
     * @param docId 文档ID
     * @param data 要更新的数据
     * @returns 是否更新成功
     */
    async update(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
        try {
            const db = this.getDB();
            await db.collection(collectionName).doc(docId).update(data);
            
            console.log(`更新 ${collectionName}/${docId} 成功`);
            return true;
        } catch (error) {
            console.error(`更新 ${collectionName}/${docId} 失败：`, error);
            return false;
        }
    }

    /**
     * 替换记录（完全替换）
     * @param collectionName 集合名称
     * @param docId 文档ID
     * @param data 要替换的数据
     * @returns 是否替换成功
     */
    async replace(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
        try {
            const db = this.getDB();
            await db.collection(collectionName).doc(docId).set(data);
            
            console.log(`替换 ${collectionName}/${docId} 成功`);
            return true;
        } catch (error) {
            console.error(`替换 ${collectionName}/${docId} 失败：`, error);
            return false;
        }
    }

    /**
     * 删除记录
     * @param collectionName 集合名称
     * @param docId 文档ID
     * @returns 是否删除成功
     */
    async delete(collectionName: string, docId: string): Promise<boolean> {
        try {
            const db = this.getDB();
            await db.collection(collectionName).doc(docId).remove();
            
            console.log(`删除 ${collectionName}/${docId} 成功`);
            return true;
        } catch (error) {
            console.error(`删除 ${collectionName}/${docId} 失败：`, error);
            return false;
        }
    }

    /**
     * 根据条件删除记录
     * @param collectionName 集合名称
     * @param where 查询条件
     * @returns 删除的记录数量
     */
    async deleteWhere(collectionName: string, where: Record<string, any>): Promise<number> {
        try {
            const db = this.getDB();
            const res = await db.collection(collectionName).where(where).remove();
            
            console.log(`删除 ${collectionName} 符合条件的记录，数量：${res.deleted}`);
            return res.deleted || 0;
        } catch (error) {
            console.error(`删除 ${collectionName} 失败：`, error);
            return 0;
        }
    }

    /**
     * 统计记录数量
     * @param collectionName 集合名称
     * @param where 查询条件
     * @returns 记录数量
     */
    async count(collectionName: string, where: Record<string, any> = {}): Promise<number> {
        try {
            const db = this.getDB();
            let query: any = db.collection(collectionName);
            
            if (Object.keys(where).length > 0) {
                query = query.where(where);
            }
            
            const res = await query.count();
            console.log(`统计 ${collectionName} 数量：${res.total}`);
            return res.total;
        } catch (error) {
            console.error(`统计 ${collectionName} 失败：`, error);
            return 0;
        }
    }

    /**
     * 分页查询
     * @param collectionName 集合名称
     * @param page 第几页（从1开始）
     * @param pageSize 每页数量
     * @param where 查询条件
     * @param orderBy 排序字段
     * @param orderByDesc 是否倒序
     * @returns { data: 数据数组, total: 总数, page: 当前页, pageSize: 每页数量, totalPages: 总页数 }
     */
    async queryByPage<T = any>(
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
        try {
            const db = this.getDB();
            let query: any = db.collection(collectionName);

            // 添加 where 条件
            if (Object.keys(where).length > 0) {
                query = query.where(where);
            }

            // 添加排序
            if (orderBy) {
                query = query.orderBy(orderBy, orderByDesc ? 'desc' : 'asc');
            }

            // 查询总数
            let countQuery: any = db.collection(collectionName);
            if (Object.keys(where).length > 0) {
                countQuery = countQuery.where(where);
            }
            const countRes = await countQuery.count();
            const total = countRes.total;
            const totalPages = Math.ceil(total / pageSize);

            // 计算跳过的数量
            const skip = (page - 1) * pageSize;

            // 查询当前页数据
            const dataRes = await query
                .skip(skip)
                .limit(pageSize)
                .get();

            return {
                data: dataRes.data as T[],
                total,
                page,
                pageSize,
                totalPages
            };
        } catch (error) {
            console.error(`分页查询 ${collectionName} 失败：`, error);
            return {
                data: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0
            };
        }
    }

    /**
     * 批量新增
     * @param collectionName 集合名称
     * @param dataArray 数据数组
     * @returns 新增的文档ID数组
     */
    async batchAdd(collectionName: string, dataArray: Record<string, any>[]): Promise<string[]> {
        const ids: string[] = [];
        for (const data of dataArray) {
            const id = await this.add(collectionName, data);
            if (id) {
                ids.push(id);
            }
        }
        return ids;
    }

    /**
     * upsert 操作：如果存在则更新，不存在则新增
     * @param collectionName 集合名称
     * @param where 查询条件
     * @param data 要新增或更新的数据
     * @returns 是否成功
     */
    async upsert(collectionName: string, where: Record<string, any>, data: Record<string, any>): Promise<boolean> {
        try {
            const db = this.getDB();
            
            // 先查询是否存在
            const existing = await db.collection(collectionName).where(where).limit(1).get();
            
            if (existing.data && existing.data.length > 0) {
                // 存在，更新
                const docId = existing.data[0]._id;
                return await this.update(collectionName, docId, data);
            } else {
                // 不存在，新增
                const id = await this.add(collectionName, { ...where, ...data });
                return id !== null;
            }
        } catch (error) {
            console.error(`upsert ${collectionName} 失败：`, error);
            return false;
        }
    }
}

export default CloudbaseDBService.getInstance();
