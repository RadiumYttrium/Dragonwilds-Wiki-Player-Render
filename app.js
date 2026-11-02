import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- WIKI STANDARD CONSTANTS ---
const RENDER_WIDTH = 600;
const RENDER_HEIGHT = 600;
const FRUSTUM_SIZE = 2.4; // Controls Fixed Zoom Level (Lower = Zoomed In, Higher = Zoomed Out)
const TARGET_Y = 0.95;    // Vertical center point of the character

const container = document.getElementById('canvas-container');

// 1. Renderer Setup (Locked to 1:1 Pixel Ratio for identical exports across all devices)
const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    preserveDrawingBuffer: true, 
    antialias: true 
});
renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT);
renderer.setPixelRatio(1); // CRITICAL: Prevents Retina/4K screens from exporting 1200x1200 images
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// 2. Scene & Fixed Lighting Setup
const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 7);
scene.add(keyLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(-5, 5, -7);
scene.add(backLight);

// 3. Locked Orthographic Camera
const camera = new THREE.OrthographicCamera(
    -FRUSTUM_SIZE / 2, FRUSTUM_SIZE / 2,
    FRUSTUM_SIZE / 2, -FRUSTUM_SIZE / 2,
    0.1, 100
);

// Pre-determined Wiki Camera Angles
const CAMERA_PRESETS = {
    'front-iso': [5, 3.5, 5],   // Standard Wiki Player Showcase
    'back-iso':  [-5, 3.5, -5], // Angled Back Showcase
    'front':     [0, TARGET_Y, 5],
    'back':      [0, TARGET_Y, -5],
    'right':     [5, TARGET_Y, 0],  // Mainhand Weapon Side
    'left':      [-5, TARGET_Y, 0]  // Offhand/Shield Side
};

function applyCameraPreset(presetKey) {
    const coords = CAMERA_PRESETS[presetKey];
    if (!coords) return;
    camera.position.set(coords[0], coords[1], coords[2]);
    camera.lookAt(0, TARGET_Y, 0);
    renderer.render(scene, camera);
}

// Initialize with Front Isometric
applyCameraPreset('front-iso');

// 4. Model Loading & Layering Logic
const loader = new GLTFLoader();
const characterGroup = new THREE.Group();
scene.add(characterGroup);

let mixers = [];
let maxDuration = 0;

async function loadFiles(files) {
    if (!files || files.length === 0) return;

    characterGroup.clear();
    mixers = [];
    maxDuration = 0;

    const fileListEl = document.getElementById('file-list');
    fileListEl.innerHTML = Array.from(files).map(f => `• ${f.name}`).join('<br>');

    try {
        const loadPromises = Array.from(files).map(file => {
            const url = URL.createObjectURL(file);
            return loader.loadAsync(url).finally(() => URL.revokeObjectURL(url));
        });

        const loadedModels = await Promise.all(loadPromises);

        loadedModels.forEach((gltf) => {
            const model = gltf.scene;
            characterGroup.add(model);

            // Sync animations across all parts that have them
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                const clip = gltf.animations[0];
                const action = mixer.clipAction(clip);
                action.play();
                mixer.setTime(0);
                mixers.push(mixer);
                if (clip.duration > maxDuration) maxDuration = clip.duration;
            }
        });

        // Update Pose Slider UI
        const slider = document.getElementById('pose-slider');
        const label = document.getElementById('pose-label');
        if (maxDuration > 0) {
            slider.disabled = false;
            slider.max = maxDuration.toFixed(2);
            slider.value = 0;
            label.textContent = `Pose Frame: 0.00s / ${maxDuration.toFixed(2)}s`;
        } else {
            slider.disabled = true;
            label.textContent = 'Static Model (No Animation)';
        }

        renderer.render(scene, camera);
    } catch (err) {
        console.error('Error loading GLB files:', err);
        fileListEl.innerHTML = '<span style="color:#ef4444;">Error loading files. Check console.</span>';
    }
}

// 5. UI Event Listeners
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => loadFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    loadFiles(e.dataTransfer.files);
});

// Angle Preset Buttons
document.querySelectorAll('.angle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.angle-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        applyCameraPreset(e.target.dataset.angle);
    });
});

// Animation Pose Scrubber
document.getElementById('pose-slider').addEventListener('input', (e) => {
    const time = parseFloat(e.target.value);
    mixers.forEach(mixer => mixer.setTime(time));
    document.getElementById('pose-label').textContent = `Pose Frame: ${time.toFixed(2)}s / ${maxDuration.toFixed(2)}s`;
    renderer.render(scene, camera);
});

// Export PNG
document.getElementById('download-btn').addEventListener('click', () => {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'wiki-render.png';
    link.click();
});
