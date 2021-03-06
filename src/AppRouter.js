import request from 'superagent';
import { debug } from './Logger';

export function getFallbackRouter(appId) {
  const prefix = appId.slice(0, 8).toLowerCase();
  return `https://${prefix}.play.lncldglobal.com/1/multiplayer/router/route`;
}

export default class AppRouter {
  constructor({ appId, server }) {
    this._appId = appId;
    this._playServer = server;
    this._url = null;
    this._serverValidTimestamp = 0;
  }

  fetch() {
    // 私有部署和本地调试
    if (this._playServer !== undefined) {
      return Promise.resolve(
        `${this._playServer}/1/multiplayer/router/authorize`
      );
    }
    const now = Date.now();
    if (now < this._serverValidTimestamp) {
      // 在有效期内，则直接返回缓存数据
      debug(`get app router from cache: ${this._url}`);
      return Promise.resolve(this._url);
    }
    return this._fetch();
  }

  _fetch() {
    return new Promise(async (resolve, reject) => {
      const url = 'https://app-router.leancloud.cn/2/route';
      const payload = {
        appId: this._appId,
      };
      try {
        const res = await request.get(url).query(payload);
        const body = JSON.parse(res.text);
        const {
          ttl,
          play_server: secondaryServer,
          multiplayer_router_server: primaryServer,
        } = body;
        const playServer = primaryServer || secondaryServer;
        if (playServer === undefined) {
          reject(new Error('router server is null'));
        }
        this._url = `https://${playServer}/1/multiplayer/router/authorize`;
        this._serverValidTimestamp = Date.now() + ttl * 1000;
        debug(`server valid timestamp: ${this._serverValidTimestamp}`);
        debug(`get app router from server: ${this._url}`);
        resolve(this._url);
      } catch (e) {
        this._url = getFallbackRouter(this._appId);
        debug(`fallback router: ${this._url}`);
        this._serverValidTimestamp = Date.now() + 10800 * 1000;
        resolve(this._url);
      }
    });
  }
}
