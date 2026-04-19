const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

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

function toErrorPayload(error) {
  return {
    errCode: error?.errCode ?? '',
    errMsg: error?.errMsg || error?.message || 'unknown error'
  };
}

async function markTask(taskId, data) {
  await db.collection(TASK_COLLECTION).doc(taskId).update({ data });
}

exports.main = async (event = {}, context) => {
  const batchSize = clampNumber(event.batchSize, 100, 1, 100);
  const dryRun = !!event.dryRun;
  const now = clampNumber(event.now, Date.now(), 0, Number.MAX_SAFE_INTEGER);

  try {
    const pendingRes = await db.collection(TASK_COLLECTION)
      .where({
        status: 'pending',
        sendAt: _.lte(now)
      })
      .orderBy('sendAt', 'asc')
      .limit(batchSize)
      .get();

    const tasks = Array.isArray(pendingRes.data) ? pendingRes.data : [];
    const results = [];

    for (const task of tasks) {
      const taskId = task._id;
      const taskResult = {
        id: taskId,
        openid: task.openid || '',
        templateId: task.templateId || '',
        success: false
      };

      if (!taskId || !task.openid || !task.templateId || !task.payload) {
        const invalidTaskError = {
          errCode: 'INVALID_TASK',
          errMsg: 'task is missing openid, templateId or payload'
        };
        const errorPayload = {
          status: 'failed',
          lastTriedAt: now,
          updatedAt: now,
          errorCode: invalidTaskError.errCode,
          errorMessage: invalidTaskError.errMsg
        };

        if (!dryRun && taskId) {
          await markTask(taskId, errorPayload);
        }

        taskResult.error = invalidTaskError;
        results.push(taskResult);
        continue;
      }

      try {
        if (!dryRun) {
          const sendRes = await cloud.openapi.subscribeMessage.send({
            touser: String(task.openid),
            templateId: String(task.templateId),
            page: typeof task.page === 'string' ? task.page : undefined,
            data: task.payload,
            miniprogramState: normalizeState(task.miniprogramState),
            lang: 'zh_CN'
          });

          await markTask(taskId, {
            status: 'sent',
            sentAt: now,
            lastTriedAt: now,
            updatedAt: now,
            errorCode: '',
            errorMessage: '',
            sendResult: {
              errCode: sendRes?.errCode ?? 0,
              errMsg: sendRes?.errMsg || 'ok'
            }
          });

          taskResult.success = true;
          taskResult.sendResult = sendRes || null;
        } else {
          taskResult.success = true;
          taskResult.dryRun = true;
        }
      } catch (error) {
        const errorInfo = toErrorPayload(error);

        if (!dryRun) {
          await markTask(taskId, {
            status: 'failed',
            lastTriedAt: now,
            updatedAt: now,
            errorCode: errorInfo.errCode,
            errorMessage: errorInfo.errMsg
          });
        }

        taskResult.error = errorInfo;
      }

      results.push(taskResult);
    }

    const successCount = results.filter((item) => item.success).length;

    return {
      success: true,
      dryRun,
      scannedCount: tasks.length,
      successCount,
      failedCount: results.length - successCount,
      results
    };
  } catch (error) {
    console.error('send_due_subscribe_messages failed:', error);
    return {
      success: false,
      error: error?.message || 'internal error'
    };
  }
};
