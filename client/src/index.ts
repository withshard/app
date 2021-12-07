import "./index.css";

import * as BABYLON from "babylonjs";
import * as GUI from 'babylonjs-gui';
import Keycode from "keycode.js";

import { client } from "./game/network";

// Re-using server-side types for networking
// This is optional, but highly recommended
import { StateHandler } from "../../server/src/rooms/StateHandler";
import { Colour, PressedKeys } from "../../server/src/entities/Player";

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

// This creates a basic Babylon Scene object (non-mesh)
var scene = new BABYLON.Scene(engine);

var camera = new BABYLON.ArcRotateCamera("camera", -1.5, 1, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
light.intensity = 0.7;

// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

const playerName = prompt("What's your name?");

const createAvatar = (scene: BABYLON.Scene, colour: Colour, name: string) => {
    const sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

        const material = new BABYLON.StandardMaterial(`mat1`, scene);
        material.alpha = 1;
        material.diffuseColor = new BABYLON.Color3(colour.r, colour.g, colour.b);
        sphere.material = material;

        const nametag = BABYLON.Mesh.CreatePlane("nametag", 0.7, scene);
        nametag.parent = sphere;
        nametag.position.y = 2;
        
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(nametag);

        const nameButton = GUI.Button.CreateSimpleButton("but1", name);
        nameButton.color = "white";
        nameButton.fontSize = 150;
        nameButton.background = "green";
        
        advancedTexture.addControl(nameButton);

        return BABYLON.Mesh.MergeMeshes([sphere, nametag], true, true, undefined, false, true);;
} 

// Colyseus / Join Room
client.joinOrCreate<StateHandler>("game", {playerName}).then(room => {

    const playerViews: {[id: string]: BABYLON.Mesh} = {};

    room.state.players.onAdd = function(player, key) {
    
        playerViews[key] = createAvatar(scene, player.colour, player.name);

        // Move the sphere upward 1/2 its height
        playerViews[key].position.set(player.position.x, player.position.y, player.position.z);

        // Update player position based on changes from the server.
        player.position.onChange = () => {
            playerViews[key].position.set(player.position.x, player.position.y, player.position.z);
        };

        // Set camera to follow current player
        if (key === room.sessionId) {
            camera.setTarget(playerViews[key].position);
        }
    };

    room.state.players.onRemove = function(player, key) {
        scene.removeMesh(playerViews[key]);
        delete playerViews[key];
    };

    room.onStateChange((state) => {
        console.log("New room state:", state.toJSON());
    });

    // Keyboard listeners
    const keyboard: PressedKeys = { x: 0, y: 0 };
    window.addEventListener("keydown", function(e) {
        if (e.which === Keycode.A) {
            keyboard.x = -1;
        } else if (e.which === Keycode.D) {
            keyboard.x = 1;
        } else if (e.which === Keycode.W) {
            keyboard.y = -1;
        } else if (e.which === Keycode.S) {
            keyboard.y = 1;
        }
        room.send('key', keyboard);
    });

    window.addEventListener("keyup", function(e) {
        if (e.which === Keycode.A) {
            keyboard.x = 0;
        } else if (e.which === Keycode.D) {
            keyboard.x = 0;
        } else if (e.which === Keycode.W) {
            keyboard.y = 0;
        } else if (e.which === Keycode.S) {
            keyboard.y = 0;
        }
        room.send('key', keyboard);
    });

    // Resize the engine on window resize
    window.addEventListener('resize', function() {
        engine.resize();
    });
});

// Scene render loop
engine.runRenderLoop(function() {
    scene.render();
});
