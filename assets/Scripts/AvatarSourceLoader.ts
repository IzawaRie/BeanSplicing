import { assetManager, ImageAsset, JsonAsset, resources, SpriteFrame, Texture2D } from 'cc';

type AvatarConfigItem = {
    id: number;
    resourcePath: string;
};

type AvatarConfigFile = {
    avatars?: AvatarConfigItem[];
};

const AVATAR_CONFIG_PATH = 'avatar/avatar_config';

let avatarConfigTask: Promise<Map<string, string>> | null = null;

export function isRemoteAvatarSource(source: string): boolean {
    return /^https:\/\//i.test((source || '').trim());
}

export async function loadSpriteFrameByResourcePath(resourcePath: string): Promise<SpriteFrame | null> {
    const safePath = (resourcePath || '').trim();
    if (!safePath) {
        return null;
    }

    return await new Promise<SpriteFrame | null>((resolve) => {
        resources.load(`${safePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame) {
                resolve(null);
                return;
            }

            resolve(spriteFrame);
        });
    });
}

export async function loadAvatarSpriteFrameBySource(
    source: string,
    shouldWarn: boolean = false,
    warnLabel: string = 'AvatarSourceLoader'
): Promise<SpriteFrame | null> {
    const safeSource = (source || '').trim();
    if (!safeSource) {
        return null;
    }

    if (isRemoteAvatarSource(safeSource)) {
        return await loadRemoteAvatarSpriteFrameWithRetry(safeSource, shouldWarn, warnLabel);
    }

    const resourcePath = await getAvatarResourcePathById(safeSource);
    if (!resourcePath) {
        if (shouldWarn) {
            console.warn(`${warnLabel}: avatar config not found for id ${safeSource}`);
        }
        return null;
    }

    const spriteFrame = await loadSpriteFrameByResourcePath(resourcePath);
    if (!spriteFrame && shouldWarn) {
        console.warn(`${warnLabel}: failed to load local avatar resource ${resourcePath}`);
    }
    return spriteFrame;
}

export function clearRemoteAvatarCache(avatarUrl: string): void {
    if (!isRemoteAvatarSource(avatarUrl)) {
        return;
    }

    const cacheManager = (assetManager as any)?.cacheManager;
    cacheManager?.removeCache?.(avatarUrl);
}

async function getAvatarResourcePathById(idSource: string): Promise<string> {
    const configMap = await loadAvatarConfigMap();
    return configMap.get((idSource || '').trim()) || '';
}

async function loadAvatarConfigMap(): Promise<Map<string, string>> {
    if (avatarConfigTask) {
        return await avatarConfigTask;
    }

    avatarConfigTask = new Promise<Map<string, string>>((resolve) => {
        resources.load(AVATAR_CONFIG_PATH, JsonAsset, (err, jsonAsset) => {
            if (err || !jsonAsset) {
                console.warn('AvatarSourceLoader: failed to load avatar config', err);
                resolve(new Map<string, string>());
                avatarConfigTask = null;
                return;
            }

            const json = (jsonAsset.json || {}) as AvatarConfigFile;
            const configMap = new Map<string, string>();
            const avatarList = Array.isArray(json.avatars) ? json.avatars : [];

            for (let index = 0; index < avatarList.length; index++) {
                const item = avatarList[index];
                const id = String(item?.id ?? '').trim();
                const resourcePath = (item?.resourcePath || '').trim();
                if (!id || !resourcePath) {
                    continue;
                }

                configMap.set(id, resourcePath);
            }

            resolve(configMap);
        });
    });

    return await avatarConfigTask;
}

async function loadRemoteAvatarSpriteFrame(
    avatarUrl: string,
    shouldWarn: boolean,
    warnLabel: string
): Promise<SpriteFrame | null> {
    return await new Promise<SpriteFrame | null>((resolve) => {
        const ext = getAvatarExtension(avatarUrl);
        assetManager.loadRemote<ImageAsset>(avatarUrl, { ext }, (err, imageAsset) => {
            if (err || !imageAsset) {
                if (shouldWarn) {
                    console.warn(`${warnLabel}: failed to load avatar ${avatarUrl}`, err);
                }
                resolve(null);
                return;
            }

            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            resolve(spriteFrame);
        });
    });
}

async function loadRemoteAvatarSpriteFrameWithRetry(
    avatarUrl: string,
    shouldWarn: boolean,
    warnLabel: string
): Promise<SpriteFrame | null> {
    let spriteFrame = await loadRemoteAvatarSpriteFrame(avatarUrl, false, warnLabel);
    if (spriteFrame) {
        return spriteFrame;
    }

    clearRemoteAvatarCache(avatarUrl);
    spriteFrame = await loadRemoteAvatarSpriteFrame(avatarUrl, shouldWarn, warnLabel);
    return spriteFrame;
}

function getAvatarExtension(avatarUrl: string): string {
    const normalizedUrl = avatarUrl.split('?')[0].toLowerCase();
    if (normalizedUrl.includes('thirdwx.qlogo.cn') || normalizedUrl.includes('wx.qlogo.cn')) {
        return '.jpg';
    }
    if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) {
        return '.jpg';
    }
    if (normalizedUrl.endsWith('.webp')) {
        return '.webp';
    }
    if (normalizedUrl.endsWith('.png')) {
        return '.png';
    }
    return '.jpg';
}
