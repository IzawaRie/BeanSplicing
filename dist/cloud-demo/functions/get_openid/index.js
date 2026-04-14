const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 获取用户 openid
 * 使用微信 auth.code2Session 接口
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
    // 从环境变量获取 appid 和 appsecret
    // 请在腾讯云云开发控制台设置环境变量
    const appid = 'wx0420daba14f55793';
    const appsecret = 'b431adcec5194e43bd7fed2a2c9864bf';

    // 使用原生 https 模块请求微信 API
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsecret}&js_code=${js_code}&grant_type=authorization_code`;
    
    const result = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        });
      }).on('error', reject);
    });

    // 检查微信返回的错误
    if (result.errcode) {
      console.error('code2session error:', result);
      return {
        success: false,
        error: result.errmsg || 'code2session failed',
        errcode: result.errcode
      };
    }

    return {
      success: true,
      openid: result.openid,
      session_key: result.session_key,
      unionid: result.unionid || null,
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
