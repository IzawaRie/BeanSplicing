const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const { code } = event;

  if (!code) {
    return { success: false, error: '缺少 code 参数' };
  }

  const APPID = 'wx0420daba14f55793';
  const SECRET = '4d6a87aa892c0db33a71ef08dfa55b77';

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;

  try {
    const result = await request(url);
    const data = JSON.parse(result);

    if (data.errcode) {
      return { success: false, error: data.errmsg };
    }

    return {
      success: true,
      openid: data.openid,
      session_key: data.session_key,
    };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
};

/**
 * 发起 GET 请求
 */
function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', err => reject(err));
    }).on('error', err => reject(err));
  });
}
