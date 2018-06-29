import Player from './Player';

export default class Room {
  constructor(play) {
    this._play = play;
  }

  /* eslint no-param-reassign: ["error", { "props": false }] */
  static newFromJSONObject(play, roomJSONObject) {
    const room = new Room(play);
    room.name = roomJSONObject.cid;
    room.opened = roomJSONObject.open;
    room.visible = roomJSONObject.visible;
    room.maxPlayerCount = roomJSONObject.maxMembers;
    room.masterActorId = roomJSONObject.masterActorId;
    room.expectedUserIds = roomJSONObject.expectMembers;
    room.players = {};
    for (let i = 0; i < roomJSONObject.members.length; i += 1) {
      const playerDTO = roomJSONObject.members[i];
      const player = Player.newFromJSONObject(play, playerDTO);
      if (player.userId === play.userId) {
        play._player = player;
      }
      room.players[player.actorId] = player;
    }
    if (roomJSONObject.attr) {
      room.properties = roomJSONObject.attr;
    } else {
      room.properties = {};
    }
    return room;
  }

  addPlayer(newPlayer) {
    if (!(newPlayer instanceof Player)) {
      throw new TypeError(`${newPlayer} is not a Player`);
    }
    this.players[newPlayer.actorId] = newPlayer;
  }

  removePlayer(actorId) {
    delete this.players[actorId];
  }

  getPlayer(actorId) {
    if (!(typeof actorId === 'number')) {
      throw new TypeError(`${actorId} is not a number`);
    }
    const player = this.players[actorId];
    if (player === null) {
      throw new TypeError(`player with id:${actorId} not found`);
    }
    return player;
  }

  get playerList() {
    return Object.values(this.players);
  }

  setCustomProperties(properties, expectedValues = null) {
    this._play.setRoomCustomProperties(properties, expectedValues);
  }

  getCustomProperties() {
    return this.properties;
  }

  _mergeProperties(changedProperties) {
    this.properties = Object.assign(this.properties, changedProperties);
  }

  _setMasterId(newMasterId) {
    this.masterActorId = newMasterId;
  }

  _setOpened(opened) {
    this.opened = opened;
  }

  _setVisible(visible) {
    this.visible = visible;
  }
}
