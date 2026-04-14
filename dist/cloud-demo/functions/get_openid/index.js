const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 获取用户 openid
 * 参考：https://developers.weixin.qq.com/miniprogram/dev/server/API/user-login/api_code2session.html
 * 
 * @param {string} js_code - 从微信客户端 wx.login() 获取的登录凭证
 * @returns {object} - 包含 openid, session_key, unionid 等信息
 */
exports.main = async (event, context) => {
  const { js_code } = event;

  // 校验参数
  if (!js_code) {
    return {
      success: false,
      error: 'js_code is required'
    };
  }

  try {
    // 调用微信 auth.code2Session 接口
    // 注意：微信云开发环境已经提供了 cloud.getWXContext()
    // 其中包含 OPENID 和 APPID
    const wxContext = cloud.getWXContext();
    
    // 如果在云函数中调用，直接返回 openid（云开发自动关联用户）
    // 否则需要通过 code2session 接口换取
    if (wxContext.OPENID) {
      return {
        success: true,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID || null,
        message: 'success'
      };
    }

    // 如果 OPENID 不存在，使用 code2session 接口
    // 需要在微信公众平台获取 appid 和 appsecret
    const appid = process.env.APPID || 'your_appid';
    const appsecret = process.env.APPSECRET || 'your_appsecret';

    const res = await cloud.request({
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      method: 'GET',
      data: {
        appid: appid,
        secret: appsecret,
        js_code: js_code,
        grant_type: 'authorization_code'
      }
    });

    const data = res.data;

    // 检查微信返回的错误
    if (data.errcode) {
      console.error('code2session error:', data);
      return {
        success: false,
        error: data.errmsg || 'code2session failed',
        errcode: data.errcode
      };
    }

    return {
      success: true,
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid || null,
      message: 'success'
    };

  } catch (err) {
    console.error('云函数执行错误:', err);
    return {
      success: false,
      error: err.message || 'internal error'
    };
  }
};
