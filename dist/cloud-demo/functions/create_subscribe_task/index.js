const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const TASK_COLLECTION = 'subscribe_tasks';

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.min(Math.max(num, min), max);
}

function normalizeState(value) {
  return value === 'developer' || value === 'trial' || value === 'formal'
    ? value
    : 'formal';
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  return payload;
}

exports.main = async (event = {}, context) => {
  const openid = typeof event.openid === 'string' ? event.openid.trim() : '';
  const now = clampNumber(event.now, Date.now(), 0, Number.MAX_SAFE_INTEGER);
  const sendAt = clampNumber(event.sendAt, now, 0, Number.MAX_SAFE_INTEGER);
  const templateId = typeof event.templateId === 'string' ? event.templateId.trim() : '';
  const page = typeof event.page === 'string' ? event.page.trim() : '';
  const payload = normalizePayload(event.payload);
  const scene = typeof event.scene === 'string' ? event.scene.trim() : '';
  const miniprogramState = normalizeState(event.miniprogramState);
  const dedupeKey = typeof event.dedupeKey === 'string' ? event.dedupeKey.trim() : '';

  if (!openid) {
    return {
      success: false,
      error: 'openid is required'
    };
  }

  if (!templateId) {
    return {
      success: false,
      error: 'templateId is required'
    };
  }

  if (!payload) {
    return {
      success: false,
      error: 'payload is required'
    };
  }

  try {
    if (dedupeKey) {
      const existingRes = await db.collection(TASK_COLLECTION)
        .where({
          openid,
          templateId,
          dedupeKey,
          status: 'pending'
        })
        .limit(1)
        .get();

      const existingTask = existingRes.data?.[0] || null;
      if (existingTask) {
        return {
          success: true,
          duplicated: true,
          taskId: existingTask._id,
          task: existingTask
        };
      }
    }

    const taskData = {
      openid,
      templateId,
      page,
      payload,
      sendAt,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      sentAt: null,
      lastTriedAt: null,
      errorCode: '',
      errorMessage: '',
      miniprogramState,
      scene,
      dedupeKey
    };

    const addRes = await db.collection(TASK_COLLECTION).add({
      data: taskData
    });

    return {
      success: true,
      duplicated: false,
      taskId: addRes._id,
      task: {
        _id: addRes._id,
        ...taskData
      }
    };
  } catch (error) {
    console.error('create_subscribe_task failed:', error);
    return {
      success: false,
      error: error?.message || 'internal error'
    };
  }
};
