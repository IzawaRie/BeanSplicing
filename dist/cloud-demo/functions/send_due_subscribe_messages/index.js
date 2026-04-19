const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

const TASK_COLLECTION = 'subscribe_tasks';
const ACCESS_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/stable_token';
const SUBSCRIBE_MESSAGE_SEND_URL = 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send';

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

function getWechatCredentials() {
  const appid = process.env.WX_APPID
    || process.env.MINIGAME_APPID
    || 'wx0420daba14f55793';
  const secret = process.env.WX_APPSECRET
    || process.env.MINIGAME_APPSECRET
    || 'b431adcec5194e43bd7fed2a2c9864bf';

  return {
    appid: typeof appid === 'string' ? appid.trim() : '',
    secret: typeof secret === 'string' ? secret.trim() : ''
  };
}

function requestJson(url, method, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const req = https.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          if (res.statusCode && res.statusCode >= 400) {
            const error = new Error(parsed.errmsg || `http status ${res.statusCode}`);
            error.errCode = parsed.errcode ?? res.statusCode;
            error.errMsg = parsed.errmsg || `http status ${res.statusCode}`;
            error.response = parsed;
            reject(error);
            return;
          }
          resolve(parsed);
        } catch (_error) {
          const parseError = new Error('failed to parse wechat response');
          parseError.errCode = 'PARSE_RESPONSE_FAILED';
          parseError.errMsg = 'failed to parse wechat response';
          parseError.rawResponse = raw;
          reject(parseError);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function getStableAccessToken() {
  const { appid, secret } = getWechatCredentials();
  if (!appid || !secret) {
    const error = new Error('missing appid or secret');
    error.errCode = 'MISSING_APP_CREDENTIALS';
    error.errMsg = 'missing appid or secret';
    throw error;
  }

  const response = await requestJson(ACCESS_TOKEN_URL, 'POST', {
    grant_type: 'client_credential',
    appid,
    secret,
    force_refresh: false
  });

  if (!response.access_token) {
    const error = new Error(response.errmsg || 'get stable access token failed');
    error.errCode = response.errcode ?? 'GET_ACCESS_TOKEN_FAILED';
    error.errMsg = response.errmsg || 'get stable access token failed';
    error.response = response;
    throw error;
  }

  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in ?? 0
  };
}

async function sendSubscribeMessageByHttps(task) {
  const tokenRes = await getStableAccessToken();
  const url = `${SUBSCRIBE_MESSAGE_SEND_URL}?access_token=${encodeURIComponent(tokenRes.accessToken)}`;
  const payload = {
    touser: String(task.openid),
    template_id: String(task.templateId),
    data: task.payload,
    miniprogram_state: normalizeState(task.miniprogramState),
    lang: 'zh_CN'
  };

  if (typeof task.page === 'string' && task.page.trim()) {
    payload.page = task.page.trim();
  }

  const response = await requestJson(url, 'POST', payload);
  if (response.errcode && response.errcode !== 0) {
    const error = new Error(response.errmsg || 'subscribe message send failed');
    error.errCode = response.errcode;
    error.errMsg = response.errmsg || 'subscribe message send failed';
    error.response = response;
    throw error;
  }

  return {
    errCode: response.errcode ?? 0,
    errMsg: response.errmsg || 'ok',
    tokenExpiresIn: tokenRes.expiresIn
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
          const sendRes = await sendSubscribeMessageByHttps(task);

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
