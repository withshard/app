import { Room, Client } from "colyseus";

import { StateHandler } from "./StateHandler";
import { Player } from "../entities/Player";

export class GameRoom extends Room<StateHandler> {
    maxClients = 8;

    onCreate () {
        this.setSimulationInterval(() => this.onUpdate());
        this.setState(new StateHandler());

        this.onMessage("key", (client, message) => {
            this.state.players.get(client.sessionId).pressedKeys = message;
        });
    }

    onJoin (client, {playerName}) {

        const player = new Player();
        player.name = playerName || `Player ${this.state.players.size}`;
        player.position.x = Math.random();
        player.position.y = 0;
        player.position.z = Math.random();

        player.colour.r = Math.random();
        player.colour.g = Math.random();
        player.colour.b = Math.random();

        this.state.players.set(client.sessionId, player);
    }

    onUpdate () {
        this.state.players.forEach((player, sessionId) => {
            player.position.x += player.pressedKeys.x * 0.1;
            player.position.z -= player.pressedKeys.y * 0.1;
        });
    }

    onLeave (client: Client) {
        this.state.players.delete(client.sessionId);
    }

    onDispose () {
    }

}
