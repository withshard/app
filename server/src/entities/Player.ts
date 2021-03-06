import { Schema, type } from "@colyseus/schema";

export interface PressedKeys {
    x: number;
    y: number;
}

export class Position extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
}

export class Colour extends Schema {
    @type("number") r: number = 0;
    @type("number") g: number = 0;
    @type("number") b: number = 0;
}

export class Player extends Schema {
    @type("string") name: string;
    @type(Position) position = new Position();
    @type(Colour) colour = new Colour();

    pressedKeys: PressedKeys = { x: 0, y: 0 };
}
