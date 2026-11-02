import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('canvas-container');

// preserveDrawingBuffer to extract the canvas to a PNG later
const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true, antialias: true });
renderer.setSize(500, 500);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

//get ortho
const aspect = 1;
const frustumSize = 3; 
const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, frustumSize * aspect / 2, 
    frustumSize / 2, frustumSize / -2, 
    0.1, 100
);

camera.position.set(5, 5, 5); 
camera.lookAt(0, 1, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

function setCameraAngle(x, y, z) {
    camera.position.set(x, y, z);
    camera.lookAt(0, 1, 0); 
    renderer.render(scene, camera);
}

document.getElementById('btn-iso').addEventListener('click', () => {
    setCameraAngle(5, 5, 5); // Classic 3/4 top-down
});

document.getElementById('btn-front').addEventListener('click', () => {
    setCameraAngle(0, 1, 5); // Dead-on front
});

document.getElementById('btn-back').addEventListener('click', () => {
    setCameraAngle(0, 1, -5); // Dead-on back, perfect for capes
});

document.getElementById('btn-weapon').addEventListener('click', () => {
    setCameraAngle(5, 1, 0); // Right profile, good for holding weapons
});
