import request from 'superagent';
import { debug, error } from './Logger';

import GameRouter from './GameRouter';
import { sdkVersion, protocolVersion } from './Config';
import PlayError from './PlayError';

const SESSION_TOKEN_KEY = 'X-LC-PLAY-MULTIPLAYER-SESSION-TOKEN';

function _tapError(e) {
  error(JSON.stringify(e));
  if (e.response.text) {
    const err = JSON.parse(e.response.text);
    const { reasonCode, detail } = err;
    return new PlayError(reasonCode, detail);
  }
  return e;
}

export default class LobbyService {
  constructor(client) {
    this._client = client;
    const { _appId, _appKey, _userId, _playServer, _feature } = this._client;

    this._gameRouter = new GameRouter(
      _appId,
      _appKey,
      _userId,
      _playServer,
      _feature
    );

    this._defaultHeaders = {
      'X-LC-ID': _appId,
      'X-LC-KEY': _appKey,
      'X-LC-PLAY-USER-ID': _userId,
      'Content-Type': 'application/json',
    };
  }

  authorize() {
    return this._gameRouter.authorize();
  }

  createRoom(roomName) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = `/1/multiplayer/lobby/room`;
        const fullUrl = `${url}${path}`;
        debug(fullUrl);
        const { _gameVersion, _insecure } = this._client;
        const data = {
          gameVersion: _gameVersion,
          sdkVersion,
          protocolVersion,
          useInsecureAddr: _insecure,
        };
        if (roomName) {
          data.cid = roomName;
        }
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr } = JSON.parse(res.text);
        resolve({ cid, addr });
      } catch (e) {
        reject(_tapError(e));
      }
    });
  }

  joinRoom({ roomName, expectedUserIds, rejoin, createOnNotFound }) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = `/1/multiplayer/lobby/room/${roomName}`;
        const fullUrl = `${url}${path}`;
        const { _gameVersion, _insecure } = this._client;
        const data = {
          cid: roomName,
          gameVersion: _gameVersion,
          sdkVersion,
          protocolVersion,
          useInsecureAddr: _insecure,
        };
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        if (rejoin !== undefined) {
          data.rejoin = rejoin;
        }
        if (createOnNotFound !== undefined) {
          data.createOnNotFound = createOnNotFound;
        }
        debug(JSON.stringify(data));
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr, roomCreated } = JSON.parse(res.text);
        resolve({ cid, addr, roomCreated });
      } catch (e) {
        reject(_tapError(e));
      }
    });
  }

  joinRandomRoom(matchProperties, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = '/1/multiplayer/lobby/match/room';
        const fullUrl = `${url}${path}`;
        const { _gameVersion, _insecure } = this._client;
        const data = {
          gameVersion: _gameVersion,
          sdkVersion,
          protocolVersion,
          useInsecureAddr: _insecure,
        };
        if (matchProperties) {
          data.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr } = JSON.parse(res.text);
        resolve({ cid, addr });
      } catch (e) {
        reject(_tapError(e));
      }
    });
  }

  matchRandom(piggybackPeerId, matchProperties, expectedUserIds) {
    if (typeof piggybackPeerId !== 'string') {
      throw new TypeError(`${piggybackPeerId} is not a string`);
    }
    if (matchProperties !== null && typeof matchProperties !== 'object') {
      throw new TypeError(`${matchProperties} is not an object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = '/1/multiplayer/lobby/match/room';
        const fullUrl = `${url}${path}`;
        const { _gameVersion, _insecure } = this._client;
        const data = {
          gameVersion: _gameVersion,
          sdkVersion,
          protocolVersion,
          piggybackPeerId,
          useInsecureAddr: _insecure,
        };
        if (matchProperties) {
          data.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr } = JSON.parse(res.text);
        resolve({ roomName: cid, addr });
      } catch (e) {
        reject(_tapError(e));
      }
    });
  }
}
