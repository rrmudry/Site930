import * as THREE from 'three';
import { PointerLockControls } from 'https://unpkg.com/three@0.179.1/examples/jsm/controls/PointerLockControls.js';
import { levels } from './levels.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const playerHeight = 10; // Player's height for collision
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// PointerLockControls
const controls = new PointerLockControls(camera, document.body);

let walls = []; // Array to store wall objects for collision detection
let enemy = null; // Variable to store the enemy object

// Function to load a level
function loadLevel(levelName) {
    // Clear existing objects from the scene (except camera and controls)
    while(scene.children.length > 0){
        const object = scene.children[0];
        if (object !== camera && object !== controls.object) {
            scene.remove(object);
        }
    }
    walls.length = 0; // Clear walls array
    enemy = null; // Clear enemy object

    const level = levels[levelName];

    // Set player start position
    controls.object.position.set(level.playerStart.x, level.playerStart.y, level.playerStart.z);

    const textureLoader = new THREE.TextureLoader();

    level.objects.forEach(obj => {
        let geometry;
        let material;
        let mesh;

        switch (obj.type) {
            case 'plane':
                geometry = new THREE.PlaneGeometry(obj.size[0], obj.size[1], 1, 1);
                const floorTexture = textureLoader.load('./textures/green_tile.png');
                floorTexture.wrapS = THREE.RepeatWrapping;
                floorTexture.wrapT = THREE.RepeatWrapping;
                floorTexture.repeat.set(obj.size[0] / 10, obj.size[1] / 10); // Adjust tiling for floor
                material = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
                mesh = new THREE.Mesh(geometry, material);
                mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
                if (obj.name === 'enemy') {
                    material = new THREE.MeshBasicMaterial({ color: obj.color });
                } else {
                    const boxTexture = textureLoader.load('./textures/texture.png');
                    boxTexture.wrapS = THREE.RepeatWrapping;
                    boxTexture.wrapT = THREE.RepeatWrapping;
                    // Set repeat based on box dimensions and a "block unit" of 10
                    boxTexture.repeat.set(obj.size[0] / 10, obj.size[1] / 10); 
                    boxTexture.needsUpdate = true; // Ensure texture updates
                    material = new THREE.MeshBasicMaterial({ map: boxTexture });
                }
                mesh = new THREE.Mesh(geometry, material);
                break;
        }

        if (mesh) {
            mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
            scene.add(mesh);

            if (obj.name === 'enemy') {
                enemy = mesh;
            }
            // Add to walls array if it's a wall (not floor or enemy)
            if (obj.type === 'box' && obj.name !== 'enemy') {
                walls.push(mesh);
            }
        }
    });
}

// Load the initial level
loadLevel('level1');

const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', function () {
    controls.lock();
});

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', function () {
    blocker.style.display = 'block';
    instructions.style.display = '';
});

scene.add(controls.object);

// Add the launcher
const launcherGeometry = new THREE.BoxGeometry(0.5, 0.5, 2); // Example size
const launcherMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
const launcher = new THREE.Mesh(launcherGeometry, launcherMaterial);
launcher.position.set(0.8, -0.6, -2); // Position relative to camera (right, down, forward)
camera.add(launcher); // Attach launcher to camera

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let projectiles = []; // Array to store active projectiles
let mouseDownTime = 0; // To track how long the mouse button is held down
const MIN_LAUNCH_VELOCITY = 50;
const MAX_LAUNCH_VELOCITY = 300;
const MAX_CHARGE_TIME = 2000; // milliseconds

// Raycaster for shooting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousedown', function (event) {
    if (controls.isLocked) {
        mouseDownTime = Date.now();
    }
});

document.addEventListener('mouseup', function (event) {
    if (controls.isLocked && mouseDownTime > 0) {
        const chargeDuration = Date.now() - mouseDownTime;
        mouseDownTime = 0; // Reset for next shot

        // Calculate launch velocity based on charge duration
        let launchVelocity = MIN_LAUNCH_VELOCITY + 
                             (MAX_LAUNCH_VELOCITY - MIN_LAUNCH_VELOCITY) * 
                             Math.min(chargeDuration / MAX_CHARGE_TIME, 1);

        // Recoil animation
        launcher.position.z += 0.5; // Move back
        launcher.rotation.x += 0.2; // Rotate up

        setTimeout(() => {
            launcher.position.z -= 0.5; // Move forward
            launcher.rotation.x -= 0.2; // Rotate down
        }, 100); // Recoil duration

        // Create and launch projectile
        const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        // Set projectile position to launcher's tip (relative to camera)
        const launcherTip = new THREE.Vector3();
        launcher.getWorldPosition(launcherTip);
        projectile.position.copy(launcherTip);

        // Set projectile velocity in the direction the camera is looking
        const projectileDirection = new THREE.Vector3();
        camera.getWorldDirection(projectileDirection);
        projectile.velocity = projectileDirection.multiplyScalar(launchVelocity); // Use calculated launchVelocity

        scene.add(projectile);
        projectiles.push(projectile);

        // Raycaster for enemy hit detection (still triggered on mouse up)
        mouse.x = 0; // Center of the screen
        mouse.y = 0; // Center of the screen

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === enemy) {
                scene.remove(enemy);
                console.log('Enemy hit!');
                break;
            }
        }
    }
});

// Keyboard input
document.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
    }
});

document.addEventListener('keyup', function (event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
});

// Game loop
const animate = () => {
    requestAnimationFrame(animate);

    const delta = 0.016; // Approximate time per frame (60 FPS)

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    // Update projectile positions
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.velocity.y -= 9.8 * 50 * delta; // Apply gravity to projectile (50 is arbitrary mass for projectile)
        projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));

        // Remove projectile if it goes too far
        if (projectile.position.distanceTo(controls.object.position) > 200) { // Adjust distance as needed
            scene.remove(projectile);
            projectiles.splice(i, 1);
        }
    }

    // Collision detection
    const playerPosition = controls.object.position;
    const playerDirection = new THREE.Vector3();
    controls.getDirection(playerDirection); // Get the direction the player is looking

    const raycasterFront = new THREE.Raycaster(playerPosition, playerDirection, 0, 1); // Check a small distance in front
    const raycasterBack = new THREE.Raycaster(playerPosition, playerDirection.clone().negate(), 0, 1);
    const raycasterLeft = new THREE.Raycaster(playerPosition, playerDirection.clone().cross(camera.up).negate(), 0, 1);
    const raycasterRight = new THREE.Raycaster(playerPosition, playerDirection.clone().cross(camera.up), 0, 1);

    // Collision detection uses the dynamically loaded walls
    // The walls array is populated in the loadLevel function

    // Check for collisions and adjust velocity
    if (moveForward) {
        const intersects = raycasterFront.intersectObjects(walls);
        if (intersects.length > 0 && intersects[0].distance < 1) { // If collision is very close
            velocity.z = 0;
        }
    }
    if (moveBackward) {
        const intersects = raycasterBack.intersectObjects(walls);
        if (intersects.length > 0 && intersects[0].distance < 1) {
            velocity.z = 0;
        }
    }
    if (moveLeft) {
        const intersects = raycasterLeft.intersectObjects(walls);
        if (intersects.length > 0 && intersects[0].distance < 1) {
            velocity.x = 0;
        }
    }
    if (moveRight) {
        const intersects = raycasterRight.intersectObjects(walls);
        if (intersects.length > 0 && intersects[0].distance < 1) {
            velocity.x = 0;
        }
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.object.position.y += (velocity.y * delta); // new behavior

    if (controls.object.position.y < playerHeight) { // Use playerHeight for floor collision
        velocity.y = 0;
        controls.object.position.y = playerHeight;
        canJump = true;
    }

    renderer.render(scene, camera);
};

animate();