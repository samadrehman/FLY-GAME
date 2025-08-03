import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

export class Aircraft extends THREE.Group {
  constructor() {
    super();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.add(body);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(8, 0.2, 1.5);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0, 0.5);
    this.add(leftWing);

    // Tail (vertical stabilizer)
    const tailGeometry = new THREE.BoxGeometry(0.3, 1.2, 1);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.7, -2.5);
    this.add(tail);

    // Optional: Move the whole plane up a bit so it sits above ground
    this.position.y = 1;
  }
}