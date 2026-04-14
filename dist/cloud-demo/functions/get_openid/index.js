exports.main = async function (event = {}) {
  const openid = event?.userInfo?.openId || null;
  const appid = event?.userInfo?.appId || null;

  return {
    ok: Boolean(openid),
    openid,
    appid,
    message: openid
      ? 'success'
      : 'OPENID not found. Call this function from a WeChat Mini Game with wx.cloud.callFunction.'
  };
};
