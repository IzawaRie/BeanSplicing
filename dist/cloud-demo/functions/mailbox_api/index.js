const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const mailboxCollection = 'mailbox';
const inboxMetaCollection = 'inbox_meta';

function normalizeInteger(value, fallback = 0) {
  const nextValue = Math.max(0, Math.floor(Number(value) || 0));
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function normalizeOpenId(value) {
  return String(value || '').trim();
}

function normalizeMail(mail) {
  if (!mail || typeof mail !== 'object') {
    return null;
  }

  return {
    id: String(mail._id || ''),
    playerOpenId: String(mail.playerOpenId || ''),
    sourceOrderId: String(mail.sourceOrderId || ''),
    source: String(mail.source || ''),
    title: String(mail.title || '礼包到账'),
    content: String(mail.content || ''),
    attachments: Array.isArray(mail.attachments) ? mail.attachments : [],
    status: String(mail.status || 'unclaimed'),
    createdAt: mail.createdAt || '',
    updatedAt: mail.updatedAt || '',
    claimedAt: mail.claimedAt || null
  };
}

async function getMeta(openid) {
  try {
    const result = await db.collection(inboxMetaCollection).doc(openid).get();
    return {
      success: true,
      data: result.data || {
        _id: openid,
        playerOpenId: openid,
        unclaimedCount: 0,
        latestMailAt: null,
        lastMailId: '',
        updatedAt: null
      }
    };
  } catch (error) {
    return {
      success: true,
      data: {
        _id: openid,
        playerOpenId: openid,
        unclaimedCount: 0,
        latestMailAt: null,
        lastMailId: '',
        updatedAt: null
      }
    };
  }
}

async function listMails(openid) {
  const result = await db
    .collection(mailboxCollection)
    .where({
      playerOpenId: openid
    })
    .orderBy('createdAt', 'desc')
    .get();

  return {
    success: true,
    data: (result.data || [])
      .map(normalizeMail)
      .filter((mail) => !!mail && ['unclaimed', 'claimed'].includes(mail.status))
  };
}

async function syncMeta(openid, event) {
  const data = {
    playerOpenId: openid,
    unclaimedCount: normalizeInteger(event.unclaimedCount, 0),
    latestMailAt: event.latestMailAt || null,
    lastMailId: String(event.lastMailId || ''),
    updatedAt: new Date().toISOString()
  };

  await db.collection(inboxMetaCollection).doc(openid).set({
    data
  });

  return {
    success: true,
    data: {
      _id: openid,
      ...data
    }
  };
}

async function claimMail(openid, mailId) {
  const mailResult = await db.collection(mailboxCollection).doc(mailId).get();
  const mail = mailResult.data;
  if (!mail || String(mail.playerOpenId || '') !== openid) {
    return {
      success: false,
      error: 'mail not found'
    };
  }

  if (String(mail.status || '') === 'claimed') {
    return {
      success: true,
      duplicated: true,
      data: normalizeMail(mail)
    };
  }

  const claimedAt = new Date().toISOString();
  await db.collection(mailboxCollection).doc(mailId).update({
    data: {
      status: 'claimed',
      claimedAt,
      updatedAt: claimedAt
    }
  });

  const listResult = await db
    .collection(mailboxCollection)
    .where({ playerOpenId: openid })
    .get();
  const mails = listResult.data || [];
  const unclaimedCount = mails.filter((item) => String(item.status || '') === 'unclaimed').length;
  const sortedMails = mails.slice().sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));

  await db.collection(inboxMetaCollection).doc(openid).set({
    data: {
      playerOpenId: openid,
      unclaimedCount,
      latestMailAt: sortedMails[0] ? sortedMails[0].createdAt : null,
      lastMailId: sortedMails[0] ? String(sortedMails[0]._id || '') : '',
      updatedAt: claimedAt
    }
  });

  return {
    success: true,
    data: normalizeMail({
      ...mail,
      status: 'claimed',
      claimedAt,
      updatedAt: claimedAt
    })
  };
}

exports.main = async (event) => {
  const action = String(event.action || '').trim();
  const openid = normalizeOpenId(event.openid);

  try {
    switch (action) {
      case 'get_meta':
        if (!openid) {
          return { success: false, error: 'openid is required' };
        }
        return await getMeta(openid);
      case 'list_mails':
        if (!openid) {
          return { success: false, error: 'openid is required' };
        }
        return await listMails(openid);
      case 'sync_meta':
        if (!openid) {
          return { success: false, error: 'openid is required' };
        }
        return await syncMeta(openid, event);
      case 'claim_mail':
        if (!openid || !event.mailId) {
          return { success: false, error: 'openid and mailId are required' };
        }
        return await claimMail(openid, String(event.mailId));
      default:
        return {
          success: false,
          error: `unsupported action: ${action}`
        };
    }
  } catch (error) {
    console.error('mailbox_api failed:', error);
    return {
      success: false,
      error: error.message || 'unknown error'
    };
  }
};
