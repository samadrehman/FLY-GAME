import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
import { Aircraft } from './aircraft.js';
import './Control.js';
import { Enemy } from './enemy.js';

const controls = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false
};
window.controls = controls;
let scene, camera, renderer, playerPlane;
let cameraTarget = new THREE.Vector3();
let enemies = [];
let bullets = [];
let enemyBullets = [];
let lastEnemyFireTime = 0;
let smokeParticles = [];
let explosions = [];
let buildings = [];

function addSun(scene) {
  // Sun sphere
  const sunGeo = new THREE.SphereGeometry(10, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(100, 200, -400);
  scene.add(sun);
  // Sun light
  const sunLight = new THREE.DirectionalLight(0xfff6e0, 1.2);
  sunLight.position.copy(sun.position);
  scene.add(sunLight);
}

function addSky(scene) {
  const skyGeo = new THREE.SphereGeometry(1200, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
}

function addBuildings(scene, count = 30) {
  buildings = [];
  for (let i = 0; i < count; i++) {
    const width = Math.random() * 12 + 8;   // Wider
    const height = Math.random() * 60 + 30; // Taller
    const depth = Math.random() * 12 + 8;   // Deeper
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({ color: 0x8888aa });
    const building = new THREE.Mesh(geometry, material);
    // Random position on the ground, but not too close to the center
    const x = (Math.random() - 0.5) * 1800;
    const z = (Math.random() - 0.5) * 1800;
    building.position.set(x, height / 2 - 1, z);
    scene.add(building);
    buildings.push(building);
  }
}

function spawnEnemies(scene, count = 5) {
  for (let i = 0; i < count; i++) {
    const enemy = new Enemy();
    // Place enemies in front of the player at random x positions and higher y
    enemy.position.set((Math.random() - 0.5) * 100, Math.random() * 20 + 15, -100 - Math.random() * 200);
    scene.add(enemy);
    enemies.push(enemy);
  }
}

function fireBullet() {
  if (!playerPlane) return;
  const bulletGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(bulletGeo, bulletMat);
  // Start at plane's nose
  bullet.position.copy(playerPlane.position);
  bullet.quaternion.copy(playerPlane.quaternion);
  scene.add(bullet);
  bullets.push(bullet);
}

function enemyFire(enemy) {
  const bulletGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const bullet = new THREE.Mesh(bulletGeo, bulletMat);
  bullet.position.copy(enemy.position);
  // Aim at player
  const dir = playerPlane.position.clone().sub(enemy.position).normalize();
  bullet.userData.velocity = dir.multiplyScalar(1.2);
  scene.add(bullet);
  enemyBullets.push(bullet);
}

function spawnSmoke() {
  if (!playerPlane) return;
  const smokeGeo = new THREE.SphereGeometry(0.7, 6, 6);
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
  const smoke = new THREE.Mesh(smokeGeo, smokeMat);
  // Place smoke behind the plane
  const offset = new THREE.Vector3(0, 0, 3);
  offset.applyQuaternion(playerPlane.quaternion);
  smoke.position.copy(playerPlane.position).add(offset);
  smoke.userData.life = 1.0; // Start fully visible
  scene.add(smoke);
  smokeParticles.push(smoke);
}

function spawnExplosion(position) {
  for (let i = 0; i < 20; i++) {
    const geo = new THREE.SphereGeometry(Math.random() * 0.5 + 0.2, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.8 });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.copy(position);
    // Give each particle a random velocity
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      life: 1.0
    };
    scene.add(particle);
    explosions.push(particle);
  }
}

function showStartOverlay(text = 'Start Game') {
  const overlay = document.getElementById('startOverlay');
  const btn = document.getElementById('startButton');
  if (overlay) overlay.style.display = 'flex';
  if (btn) btn.textContent = text;
}

function resetGame() {
  // Remove all objects from the scene except the camera and lights
  for (const obj of [...scene.children]) {
    if (
      obj !== camera &&
      !(obj.isLight) &&
      obj.type !== 'AmbientLight'
    ) {
      scene.remove(obj);
    }
  }
  // Reset arrays and variables
  enemies = [];
  bullets = [];
  enemyBullets = [];
  smokeParticles = [];
  explosions = [];
  playerPlane = null;
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') controls.fire = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') controls.fire = false;
});

let lastFireTime = 0;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue

  // Camera
  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 2000
  );
  camera.position.set(0, 5, 20);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  // Sun and sky
  addSun(scene);
  addSky(scene);

  // Fog for softness
  scene.fog = new THREE.Fog(0x87ceeb, 30, 2000);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  const groundMat = new THREE.MeshPhongMaterial({
    color: 0x3cb371, // More visible green
    shininess: 10,
    specular: 0xdddddd
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  scene.add(ground);

  // Player Plane
  playerPlane = new Aircraft();
  scene.add(playerPlane);

  // Add buildings
  addBuildings(scene);

  // Add enemies
  spawnEnemies(scene, 7);

  animate();
}

function animate(time) {
  requestAnimationFrame(animate);

  if (playerPlane) {
    // Improved left/right controls with roll and auto-leveling
    if (controls.left) {
      playerPlane.rotation.y += 0.03; // Yaw
      playerPlane.rotation.z = Math.min(playerPlane.rotation.z + 0.025, 0.5); // Roll left, limit
    }
    else if (controls.right) {
      playerPlane.rotation.y -= 0.03; // Yaw
      playerPlane.rotation.z = Math.max(playerPlane.rotation.z - 0.025, -0.5); // Roll right, limit
    } else {
      // Auto-level roll when not turning
      playerPlane.rotation.z *= 0.9;
    }

    // Pitch (up/down)
    if (controls.up) playerPlane.rotation.x += 0.02;
    if (controls.down) playerPlane.rotation.x -= 0.02;

    // Limit pitch so the plane doesn't flip
    playerPlane.rotation.x = Math.max(Math.min(playerPlane.rotation.x, Math.PI / 4), -Math.PI / 4);

    // Move forward in the direction the plane is facing
    const speed = 0.5;
    playerPlane.translateZ(-speed);

    // Dynamic camera: always behind and above the plane
    const cameraOffset = new THREE.Vector3(0, 6, 18); // (x, y, z)
    cameraOffset.applyQuaternion(playerPlane.quaternion);
    const desiredCameraPos = playerPlane.position.clone().add(cameraOffset);
    camera.position.lerp(desiredCameraPos, 0.1);
    camera.lookAt(playerPlane.position);

    // Fire bullets (rate limit)
    if (controls.fire && time - lastFireTime > 200) {
      fireBullet();
      lastFireTime = time;
    }

    // Plane-ground collision
    if (playerPlane.position.y < 0) {
      spawnExplosion(playerPlane.position);
      scene.remove(playerPlane);
      playerPlane = null;
      showStartOverlay('Restart Game');
    }

    // Spawn smoke every frame
    spawnSmoke();
  }

  // Update and fade smoke particles
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const smoke = smokeParticles[i];
    smoke.userData.life -= 0.01;
    smoke.material.opacity = Math.max(smoke.userData.life, 0);
    smoke.position.y += 0.01; // Let smoke rise a bit
    if (smoke.userData.life <= 0) {
      scene.remove(smoke);
      smokeParticles.splice(i, 1);
    }
  }

  // Move bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.translateZ(-1.5);
    if (bullet.position.length() > 2000) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }

  // Improved enemy logic: chase, dodge, altitude, face player
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (playerPlane) {
      // Calculate direction to player (XZ plane)
      const toPlayer = playerPlane.position.clone().sub(enemy.position);
      toPlayer.y = 0;
      toPlayer.normalize();
      // Move toward player in XZ
      enemy.position.x += toPlayer.x * 0.25;
      enemy.position.z += toPlayer.z * 0.4;
      // Smoothly adjust altitude to match or stay above player
      if (enemy.position.y < playerPlane.position.y + 5) {
        enemy.position.y += 0.1;
      } else if (enemy.position.y > playerPlane.position.y + 10) {
        enemy.position.y -= 0.1;
      }
      // Occasional dodge left/right
      enemy.position.x += Math.sin(Date.now() * 0.001 + i) * 0.2;
      // Face the player
      enemy.lookAt(playerPlane.position.x, enemy.position.y, playerPlane.position.z);
    } else {
      // If no player, just move forward
      enemy.position.z += 0.4;
    }
    // Remove if too far behind player
    if (playerPlane && enemy.position.z > playerPlane.position.z + 50) {
      scene.remove(enemy);
      enemies.splice(i, 1);
    }
  }

  // --- Enemy-enemy collision ---
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      if (enemies[i].position.distanceTo(enemies[j].position) < 3) {
        spawnExplosion(enemies[i].position);
        spawnExplosion(enemies[j].position);
        scene.remove(enemies[j]);
        scene.remove(enemies[i]);
        enemies.splice(j, 1);
        enemies.splice(i, 1);
        i--;
        break;
      }
    }
  }

  // --- Enemy-building collision ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    for (const building of buildings) {
      // Use building width for collision radius
      const bWidth = building.geometry.parameters.width || 10;
      if (enemies[i].position.distanceTo(building.position) < (bWidth / 2 + 2)) {
        spawnExplosion(enemies[i].position);
        scene.remove(enemies[i]);
        enemies.splice(i, 1);
        break;
      }
    }
  }

  // --- Enemy-ground collision ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].position.y < 0) {
      spawnExplosion(enemies[i].position);
      scene.remove(enemies[i]);
      enemies.splice(i, 1);
    }
  }

  // Enemies fire at intervals (smarter)
  if (playerPlane && time - lastEnemyFireTime > 1200) {
    for (const enemy of enemies) {
      const toPlayer = playerPlane.position.clone().sub(enemy.position);
      if (toPlayer.length() < 200) {
        // Only fire if roughly facing the player
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(enemy.quaternion);
        if (forward.dot(toPlayer.normalize()) > 0.7 && Math.random() < 0.5) {
          enemyFire(enemy);
        }
      }
    }
    lastEnemyFireTime = time;
  }

  // Move enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    bullet.position.add(bullet.userData.velocity);
    if (bullet.position.length() > 2000) {
      scene.remove(bullet);
      enemyBullets.splice(i, 1);
    }
  }

  // Check enemy bullet hits player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    if (playerPlane && bullet.position.distanceTo(playerPlane.position) < 2) {
      spawnExplosion(playerPlane.position);
      scene.remove(playerPlane);
      playerPlane = null;
      showStartOverlay('Restart Game');
      scene.remove(bullet);
      enemyBullets.splice(i, 1);
      break;
    }
  }

  // Check player bullet hits enemy
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (bullet.position.distanceTo(enemy.position) < 2) {
        spawnExplosion(enemy.position);
        scene.remove(enemy);
        enemies.splice(j, 1);
        scene.remove(bullet);
        bullets.splice(i, 1);
        break;
      }
    }
  }

  // Animate explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.position.add(p.userData.velocity.clone().multiplyScalar(0.2));
    p.scale.multiplyScalar(1.05);
    p.material.opacity *= 0.93;
    p.userData.life -= 0.02;
    if (p.userData.life <= 0 || p.material.opacity < 0.05) {
      scene.remove(p);
      explosions.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Wait for start button
const startBtn = document.getElementById('startButton');
if (startBtn) {
  startBtn.addEventListener('click', () => {
    document.getElementById('startOverlay').style.display = 'none';
    if (scene) resetGame();
    init();
  });
}