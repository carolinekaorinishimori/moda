import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Urban Fashion 3D - Human Experience
 * Versão com 10 Rostos dinâmicos
 */

class FashionGame {
    constructor() {
        this.canvas = document.getElementById('three-canvas');
        this.loaderFill = document.getElementById('progress-fill');
        this.loaderOverlay = document.getElementById('loader');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        this.avatar = null;
        this.meshes = {};
        this.clock = new THREE.Clock();
        this.mixer = null;

        this.init();
    }

    async init() {
        this.setupRenderer();
        this.setupLighting();
        this.setupControls();

        // Carrega o modelo humano
        await this.loadModel('assets/avatar_base.glb');

        this.setupUI();
        this.animate();

        setTimeout(() => {
            this.loaderOverlay.style.opacity = '0';
            setTimeout(() => this.loaderOverlay.style.display = 'none', 800);
        }, 500);
    }

    setupRenderer() {
        const width = window.innerWidth - (window.innerWidth > 900 ? 380 : 0);
        this.renderer.setSize(width, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
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

    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        const mainLight = new THREE.DirectionalLight(0xfff5e1, 1.5);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const rimLight = new THREE.SpotLight(0xffffff, 5);
        rimLight.position.set(0, 5, -8);
        this.scene.add(rimLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 2.5;
        this.controls.maxDistance = 5;
        this.controls.target.set(0, 1.4, 0);
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

                            // Material de pele humano inicial
                            if (child.name.toLowerCase().includes('skin') || child.name.toLowerCase().includes('body')) {
                                child.material = new THREE.MeshStandardMaterial({
                                    color: 0xe8beac,
                                    roughness: 0.8
                                });
                            }
                        }
                    });

                    if (gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                    }
                    resolve();
                },
                (xhr) => {
                    const p = (xhr.loaded / xhr.total) * 100;
                    if (this.loaderFill) this.loaderFill.style.width = p + '%';
                },
                (error) => {
                    this.createPlaceholderHuman();
                    resolve();
                }
            );
        });
    }

    createPlaceholderHuman() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0xe8beac });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), mat);
        torso.position.y = 1.3;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18), mat);
        head.position.y = 1.8;
        group.add(torso, head);
        this.avatar = group;
        this.scene.add(this.avatar);
        this.meshes['Body'] = torso;
        this.meshes['Head'] = head;
    }

    applyTexture(partName, textureUrl) {
        // Tenta aplicar na malha 'Body' ou 'Head' se o nome do arquivo indicar pele/rosto
        const target = this.meshes[partName] || this.meshes['Body'] || this.meshes['Head'];
        if (!target) return;

        new THREE.TextureLoader().load(textureUrl, (tex) => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
            target.material.map = tex;
            target.material.color.set(0xffffff);
            target.material.needsUpdate = true;
        });
    }

    setupUI() {
        const grid = document.getElementById('options-grid');

        // Base de dados com as 7 categorias e os 10 rostos divididos
        const items = {
            skin: [
                { name: 'Rosto 1', mesh: 'Body', tex: 'assets/skin/rosto_1.png' },
                { name: 'Rosto 2', mesh: 'Body', tex: 'assets/skin/rosto_2.png' },
                { name: 'Rosto 3', mesh: 'Body', tex: 'assets/skin/rosto_3.png' },
                { name: 'Rosto 4', mesh: 'Body', tex: 'assets/skin/rosto_4.png' },
                { name: 'Rosto 5', mesh: 'Body', tex: 'assets/skin/rosto_5.png' },
                { name: 'Rosto 6', mesh: 'Body', tex: 'assets/skin/rosto_6.png' },
                { name: 'Rosto 7', mesh: 'Body', tex: 'assets/skin/rosto_7.png' },
                { name: 'Rosto 8', mesh: 'Body', tex: 'assets/skin/rosto_8.png' },
                { name: 'Rosto 9', mesh: 'Body', tex: 'assets/skin/rosto_9.png' },
                { name: 'Rosto 10', mesh: 'Body', tex: 'assets/skin/rosto_10.png' }
            ],
            makeup: [
                { name: 'Natural', mesh: 'Body', tex: 'assets/makeup/makeup_natural.png' },
                { name: 'Bold', mesh: 'Body', tex: 'assets/makeup/makeup_bold.png' }
            ],
            nails: [
                { name: 'Vermelha', mesh: 'Body', tex: 'assets/nails/nails_red.png' }
            ],
            outfit: [
                { name: 'Top Branco', mesh: 'Body', tex: 'assets/clothing/top_white.jpg' },
                { name: 'Preto Chic', mesh: 'Body', tex: 'assets/clothing/top_black.jpg' }
            ],
            shoes: [
                { name: 'Tênis', mesh: 'Body', tex: 'assets/shoes/sneakers.png' }
            ],
            hair: [
                { name: 'Loiro', mesh: 'Hair', tex: 'assets/hair/hair_blonde.jpg' },
                { name: 'Preto', mesh: 'Hair', tex: 'assets/hair/hair_black.jpg' }
            ],
            accessories: [
                { name: 'Óculos', mesh: 'Acc', tex: 'assets/accessories/glasses.png' }
            ]
        };

        const render = (cat) => {
            grid.innerHTML = '';
            (items[cat] || []).forEach(item => {
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

        document.getElementById('finish-btn').onclick = () => {
            document.getElementById('completion-overlay').classList.remove('hidden');
            this.avatar.position.z += 1; // Pequeno movimento de saída
        };

        render('skin'); // Inicia na pele para ver os novos rostos
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.mixer) this.mixer.update(this.clock.getDelta());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => new FashionGame();
