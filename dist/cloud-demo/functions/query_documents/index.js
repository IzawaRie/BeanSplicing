const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.min(Math.max(num, min), max);
}

function normalizeWhere(where) {
  if (!where || typeof where !== 'object' || Array.isArray(where)) {
    return {};
  }
  return where;
}

exports.main = async (event = {}, context) => {
  const {
    collection,
    docId,
    where,
    orderBy,
    order = 'asc',
    limit = 20,
    skip = 0,
    countOnly = false,
  } = event;

  if (!collection || typeof collection !== 'string') {
    return {
      success: false,
      error: 'collection is required'
    };
  }

  try {
    if (docId) {
      const result = await db.collection(collection).doc(String(docId)).get();
      return {
        success: true,
        mode: 'doc',
        data: result.data || null
      };
    }

    const safeWhere = normalizeWhere(where);
    const safeLimit = clampNumber(limit, 20, 1, 100);
    const safeSkip = clampNumber(skip, 0, 0, 100000);
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    let query = db.collection(collection);
    if (Object.keys(safeWhere).length > 0) {
      query = query.where(safeWhere);
    }

    if (orderBy && typeof orderBy === 'string') {
      query = query.orderBy(orderBy, sortOrder);
    }

    if (countOnly) {
      const countRes = await query.count();
      return {
        success: true,
        mode: 'count',
        total: countRes.total || 0
      };
    }

    const [listRes, countRes] = await Promise.all([
      query.skip(safeSkip).limit(safeLimit).get(),
      query.count()
    ]);

    return {
      success: true,
      mode: 'list',
      data: listRes.data || [],
      pagination: {
        skip: safeSkip,
        limit: safeLimit,
        actualCount: Array.isArray(listRes.data) ? listRes.data.length : 0,
        total: countRes.total || 0
      }
    };
  } catch (error) {
    console.error('query_documents failed:', error);
    return {
      success: false,
      error: error.message || 'internal error'
    };
  }
};
