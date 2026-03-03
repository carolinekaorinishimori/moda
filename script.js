import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Fashion 3D Experience - Main Script
 */

class FashionGame {
    constructor() {
        this.canvas = document.getElementById('three-canvas');
        this.loaderBar = document.getElementById('progress-fill');
        this.loaderOverlay = document.getElementById('loader');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        this.avatar = null;
        this.meshes = {};      // Stores character parts (hair, tops, etc)
        this.materials = {};   // Stores materials for easy swapping
        this.mixer = null;     // Animation mixer
        this.clock = new THREE.Clock();

        this.init();
    }

    async init() {
        this.setupRenderer();
        this.setupLights();
        this.setupControls();

        // Load the 3D Avatar
        // FILE LOCATION: C:\Users\26012211\Documents\GitHub\moda\assets\avatar_base.glb
        await this.loadModel('assets/avatar_base.glb');

        this.setupUI();
        this.animate();

        // Hide loader after a small delay
        setTimeout(() => {
            this.loaderOverlay.style.opacity = '0';
            setTimeout(() => this.loaderOverlay.style.display = 'none', 800);
        }, 500);
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth - 380, window.innerHeight); // adjust for sidebar
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        window.addEventListener('resize', () => {
            const width = window.innerWidth - (window.innerWidth > 900 ? 380 : 0);
            this.camera.aspect = width / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, window.innerHeight);
        });
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 2.5);
        directional.position.set(2, 5, 5);
        directional.castShadow = true;
        this.scene.add(directional);

        // Backlight for edge definition
        const spot = new THREE.SpotLight(0xffffff, 5);
        spot.position.set(-5, 5, -5);
        this.scene.add(spot);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 6;
        this.controls.maxPolarAngle = Math.PI / 1.8; // Limit ground view
        this.controls.target.set(0, 1, 0);

        this.camera.position.set(0, 1.5, 4);
    }

    async loadModel(url) {
        const loader = new GLTFLoader();

        return new Promise((resolve) => {
            loader.load(url,
                (gltf) => {
                    this.avatar = gltf.scene;
                    this.scene.add(this.avatar);

                    // Identify meshes for swapping
                    this.avatar.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            this.meshes[child.name] = child;

                            // Initialize with gray material (default)
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x888888,
                                roughness: 0.5
                            });
                        }
                    });

                    // Set up Animation Mixer
                    if (gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        // Store animations for later (e.g., "Walk")
                        this.animations = gltf.animations;
                    }

                    resolve();
                },
                (xhr) => {
                    const percent = (xhr.loaded / xhr.total) * 100;
                    this.loaderBar.style.width = percent + '%';
                },
                (error) => {
                    console.warn('Error loading GLB. Using placeholder geometry.', error);
                    this.createPlaceholderAvatar();
                    resolve();
                }
            );
        });
    }

    createPlaceholderAvatar() {
        const group = new THREE.Group();
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 1;
        group.add(body);
        this.avatar = group;
        this.scene.add(this.avatar);
    }

    /**
     * Logic for texture/mesh swapping
     * @param {string} partName Name of the mesh in GLB
     * @param {string} textureUrl URL to image (JPG/PNG)
     */
    applyCustomization(partName, textureUrl) {
        const targetMesh = this.meshes[partName];
        if (!targetMesh) return;

        const texLoader = new THREE.TextureLoader();
        texLoader.load(textureUrl, (texture) => {
            texture.flipY = false; // Usually needed for GLTF
            texture.colorSpace = THREE.SRGBColorSpace;

            targetMesh.material.map = texture;
            targetMesh.material.needsUpdate = true;
        });
    }

    setupUI() {
        const finishBtn = document.getElementById('finish-btn');
        const grid = document.getElementById('options-grid');
        const tabs = document.querySelectorAll('.tab-btn');

        // Example items (can be moved to JSON)
        const items = {
            outfit: [
                { name: 'Casual White', mesh: 'Body', tex: 'assets/textures/top_white.jpg' },
                { name: 'Dark Chic', mesh: 'Body', tex: 'assets/textures/top_black.jpg' }
            ],
            hair: [
                { name: 'Blonde Bob', mesh: 'Hair', tex: 'assets/textures/hair_blonde.jpg' },
                { name: 'Deep Black', mesh: 'Hair', tex: 'assets/textures/hair_black.jpg' }
            ],
            skin: [
                { name: 'Natural', mesh: 'Skin', tex: 'assets/textures/skin_fair.jpg' },
                { name: 'Sunkissed', mesh: 'Skin', tex: 'assets/textures/skin_tan.jpg' }
            ]
        };

        const renderCategory = (catId) => {
            grid.innerHTML = '';
            (items[catId] || []).forEach(item => {
                const card = document.createElement('div');
                card.className = 'option-card';
                card.innerHTML = `<div class="thumb-preview"></div><p>${item.name}</p>`;
                card.onclick = () => this.applyCustomization(item.mesh, item.tex);
                grid.appendChild(card);
            });
        };

        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderCategory(tab.dataset.category);
            };
        });

        finishBtn.onclick = () => this.triggerExitAnimation();

        // Initial render
        renderCategory('outfit');
    }

    triggerExitAnimation() {
        const overlay = document.getElementById('completion-overlay');

        // 1. Play Walk Animation if it exists
        if (this.mixer && this.animations) {
            const walkClip = THREE.AnimationClip.findByName(this.animations, 'Walk');
            if (walkClip) {
                const action = this.mixer.clipAction(walkClip);
                action.play();
            }
        }

        // 2. Move Avatar Forward (Z axis)
        // Note: Using a simple linear move as a demonstration
        const startPos = this.avatar.position.z;
        const targetPos = startPos + 5;
        let progress = 0;

        const moveInterval = setInterval(() => {
            progress += 0.01;
            this.avatar.position.z = THREE.MathUtils.lerp(startPos, targetPos, progress);

            if (progress >= 1) {
                clearInterval(moveInterval);
                overlay.classList.remove('hidden');
                overlay.style.opacity = '1';
            }
        }, 16);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the Experience
window.onload = () => new FashionGame();
