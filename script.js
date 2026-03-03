import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Fashion 3D Experience - Human Model Version
 */

class FashionGame {
    constructor() {
        this.canvas = document.getElementById('three-canvas');
        this.loaderBar = document.getElementById('progress-fill');
        this.loaderOverlay = document.getElementById('loader');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        this.avatar = null;
        this.meshes = {};
        this.materials = {};
        this.mixer = null;
        this.clock = new THREE.Clock();

        // Configuration for Realistic Human Look
        this.HUMAN_CONFIG = {
            skinColor: 0xe8beac, // Realistic base skin tone
            eyeColor: 0x3d2314,
            hairColor: 0x221100
        };

        this.init();
    }

    async init() {
        this.setupRenderer();
        this.setupCinematicLighting();
        this.setupControls();

        // Load the 3D Avatar (Expects a Rigged Human Model)
        // FILE: C:\Users\26012211\Documents\GitHub\moda\assets\avatar_base.glb
        await this.loadModel('assets/avatar_base.glb');

        this.setupUI();
        this.animate();

        setTimeout(() => {
            if (this.loaderOverlay) {
                this.loaderOverlay.style.opacity = '0';
                setTimeout(() => this.loaderOverlay.style.display = 'none', 800);
            }
        }, 500);
    }

    setupRenderer() {
        const width = window.innerWidth - (window.innerWidth > 900 ? 380 : 0);
        this.renderer.setSize(width, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        window.addEventListener('resize', () => {
            const w = window.innerWidth - (window.innerWidth > 900 ? 380 : 0);
            this.camera.aspect = w / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, window.innerHeight);
        });
    }

    setupCinematicLighting() {
        // High-end Portrait Lighting
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.0);
        keyLight.position.set(5, 5, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        this.scene.add(keyLight);

        const wrapLight = new THREE.PointLight(0xffffff, 0.8);
        wrapLight.position.set(-5, 3, 2);
        this.scene.add(wrapLight);

        const rimLight = new THREE.SpotLight(0xffffff, 8);
        rimLight.position.set(0, 5, -8);
        rimLight.target.position.set(0, 1, 0);
        this.scene.add(rimLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2.5;
        this.controls.maxDistance = 5;
        this.controls.target.set(0, 1.2, 0); // Focus on the model's upper body/face

        this.camera.position.set(0, 1.6, 3.5);
    }

    async loadModel(url) {
        const loader = new GLTFLoader();
        return new Promise((resolve) => {
            loader.load(url,
                (gltf) => {
                    this.avatar = gltf.scene;
                    this.scene.add(this.avatar);

                    this.avatar.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            this.meshes[child.name] = child;

                            // Apply realistic human/skin material
                            const isSkin = child.name.toLowerCase().includes('skin') || child.name.toLowerCase().includes('body');
                            child.material = new THREE.MeshStandardMaterial({
                                color: isSkin ? this.HUMAN_CONFIG.skinColor : 0xdddddd,
                                roughness: isSkin ? 0.7 : 0.9,
                                metalness: isSkin ? 0.02 : 0,
                                envMapIntensity: 1.0
                            });
                        }
                    });

                    if (gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        this.animations = gltf.animations;
                    }
                    resolve();
                },
                (xhr) => {
                    if (this.loaderBar) {
                        const percent = (xhr.loaded / xhr.total) * 100;
                        this.loaderBar.style.width = percent + '%';
                    }
                },
                (error) => {
                    console.warn('Model not found. Creating Human Placeholder Geometry.');
                    this.createHumanPlaceholder();
                    resolve();
                }
            );
        });
    }

    createHumanPlaceholder() {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: this.HUMAN_CONFIG.skinColor, roughness: 0.7 });

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), skinMat);
        torso.position.y = 1.35;
        group.add(torso);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
        head.position.y = 1.85;
        group.add(head);

        // Limbs (demonstrative)
        const limbGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.8);
        const lLeg = new THREE.Mesh(limbGeo, skinMat); lLeg.position.set(-0.15, 0.6, 0); group.add(lLeg);
        const rLeg = new THREE.Mesh(limbGeo, skinMat); rLeg.position.set(0.15, 0.6, 0); group.add(rLeg);

        this.avatar = group;
        this.scene.add(this.avatar);
        this.meshes['Body'] = torso; // for testing customization
    }

    applyTexture(partName, textureUrl) {
        const target = this.meshes[partName] || this.avatar;
        if (!target) return;

        new THREE.TextureLoader().load(textureUrl, (tex) => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
            if (target.material) {
                target.material.map = tex;
                target.material.color.set(0xffffff); // Clear base color when texture is applied
                target.material.needsUpdate = true;
            }
        });
    }

    setupUI() {
        const grid = document.getElementById('options-grid');
        const items = {
            outfit: [
                { name: 'Seda Branca', mesh: 'Body', tex: 'assets/textures/top_white.jpg' },
                { name: 'Veludo Preto', mesh: 'Body', tex: 'assets/textures/top_black.jpg' }
            ],
            hair: [
                { name: 'Loiro Natural', mesh: 'Hair', tex: 'assets/textures/hair_blonde.jpg' },
                { name: 'Castanho Escuro', mesh: 'Hair', tex: 'assets/textures/hair_black.jpg' }
            ],
            skin: [
                { name: 'Pele Clara', mesh: 'Body', tex: 'assets/textures/skin_fair.jpg' },
                { name: 'Pele Bronzeada', mesh: 'Body', tex: 'assets/textures/skin_tan.jpg' }
            ]
        };

        const render = (cat) => {
            grid.innerHTML = '';
            items[cat].forEach(item => {
                const card = document.createElement('div');
                card.className = 'option-card';
                card.innerHTML = `<div class="thumb-preview"></div><p>${item.name}</p>`;
                card.onclick = () => this.applyTexture(item.mesh, item.tex);
                grid.appendChild(card);
            });
        };

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render(btn.dataset.category);
            };
        });

        document.getElementById('finish-btn').onclick = () => this.finish();
        render('outfit');
    }

    finish() {
        document.getElementById('completion-overlay').classList.remove('hidden');
        // Simple forward move
        let pos = 0;
        const walk = () => {
            if (pos < 1) {
                pos += 0.01;
                this.avatar.position.z += 0.05;
                requestAnimationFrame(walk);
            }
        };
        walk();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => new FashionGame();
