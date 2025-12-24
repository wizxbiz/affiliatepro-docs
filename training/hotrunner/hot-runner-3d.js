/**
 * hot-runner-3d.js
 * ไฟล์นี้ใช้สำหรับการสร้างและควบคุมโมเดล 3D ของ Hot Runner System
 */

// ตัวแปรสำหรับ Three.js// ตัวแปรสำหรับ Three.js
let scene, camera, renderer, controls;
let valveGateModel, thermalGateModel, openTipModel;
let currentModel = null;
let modelInitialized = false;
let labelVisible = false;
let labels = [];
let plasticParticles = [];
let isExploded = false;
let cameraPositions = {};
let raycaster, mouse;
let hoveredPart = null;
let loadingManager, progressBar;
let ambientLight, directionalLight, spotLight;
let materialLibrary = {};
let textureLibrary = {};
let effectComposer, outlinePass;
let stats;
let gui;
let clock;
let mixer;
let currentModelType = 'valve-gate';


// ค่าคงที่และการตั้งค่า
const COLORS = {
    background: 0xf0f0f0,
    manifold: 0x3366cc,
    housing: 0x777777,
    pin: 0xcccccc,
    tipValve: 0xdd3333,
    tipThermal: 0xee9900,
    tipOpen: 0x000000,
    heaterValve: 0xff6600,
    heaterThermal: 0xff3300,
    heaterOpen: 0xff4400,
    pipe: 0x666666,
    sprue: 0x444444,
    plastic: 0x00ff00,
    highlight: 0xffff00,
    selected: 0xff0000
};

const SETTINGS = {
    shadows: true,
    reflections: true,
    antialiasing: true,
    particleCount: 100,
    animationSpeed: 1.0,
    highlightParts: true,
    showLabels: false,
    showWireframe: false,
    showBoundingBox: false,
    showHelpers: false,
    physicsEnabled: false
};

// เริ่มต้นการทำงานของ Three.js
function initThreeJS(containerId = 'three-js-container') {
    if (modelInitialized) return;
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    // เตรียมการแสดงผลการโหลด
    setupLoadingManager(container);
    
    // สร้าง clock สำหรับการทำแอนิเมชัน
    clock = new THREE.Clock();
    
    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 10, 50);
    
    // Setup camera
    setupCamera(container);
    
    // Setup renderer
    setupRenderer(container);
    
    // Setup raycaster สำหรับเมาส์
    setupRaycaster(container);
    
    // Setup controls
    setupControls();
    
    // Setup lighting
    setupLights();
    
    // Setup materials
    setupMaterials();
    
    // Setup effects
    setupEffects();
    
    // Setup GUI
    if (window.location.hash.includes('debug')) {
        setupGUI();
        setupStats(container);
    }
    
    // สร้างพื้นสำหรับโมเดล
    createEnvironment();
    
    // Load textures
    loadTextures().then(() => {
        // สร้างโมเดล
        createModels();
        
        // สร้างป้ายชื่อ
        createLabels();
        
        // เริ่มต้นระบบฟิสิกส์ถ้าเปิดใช้งาน
        if (SETTINGS.physicsEnabled) {
            initPhysics();
        }
        
        // บันทึกตำแหน่งกล้องสำหรับแต่ละมุมมอง
        setupCameraPositions();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // จัดการเหตุการณ์เมาส์
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('click', onMouseClick);
        
        // Start animation loop
        animate();
        
        // Show valve gate model by default
        showModel('valve-gate');
        
        modelInitialized = true;
        
        // ซ่อนการแสดงผลการโหลด
        hideLoadingScreen();
        
        console.log('Three.js initialized successfully');
    });
    
    return {
        scene,
        camera,
        renderer,
        controls
    };
}

// ฟังก์ชันตั้งค่าการจัดการไฟล์
function setupLoadingManager(container) {
    loadingManager = new THREE.LoadingManager();
    
    // สร้างหน้าจอแสดงการโหลด
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'absolute';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.background = 'rgba(0, 0, 0, 0.7)';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '1000';
    loadingScreen.style.color = 'white';
    loadingScreen.style.fontFamily = 'Arial, sans-serif';
    
    loadingScreen.innerHTML = `
        <h3>กำลังโหลดโมเดล 3D...</h3>
        <div style="width: 80%; height: 20px; background-color: #333; border-radius: 10px; margin-top: 20px; overflow: hidden;">
            <div id="loading-progress" style="width: 0%; height: 100%; background-color: #0066cc; transition: width 0.3s;"></div>
        </div>
        <p id="loading-percentage">0%</p>
    `;
    
    container.appendChild(loadingScreen);
    progressBar = document.getElementById('loading-progress');
    const percentageText = document.getElementById('loading-percentage');
    
    // ตั้งค่าการจัดการไฟล์
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = Math.min(itemsLoaded / itemsTotal * 100, 100);
        if (progressBar) progressBar.style.width = progress + '%';
        if (percentageText) percentageText.textContent = Math.round(progress) + '%';
    };
    
    loadingManager.onError = function(url) {
        console.error('Error loading:', url);
    };
}

// ซ่อนหน้าจอการโหลด
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}


// ตั้งค่ากล้อง
function setupCamera(container) {
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.layers.enable(1); // Layer for outlines
}

// ตั้งค่า renderer
function setupRenderer(container) {
    const options = {
        antialias: SETTINGS.antialiasing,
        alpha: true
    };
    
    renderer = new THREE.WebGLRenderer(options);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = SETTINGS.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    container.appendChild(renderer.domElement);
}
// เพิ่มคุณภาพของวัสดุให้สมจริงมากขึ้น
function setupEnhancedMaterials() {
    // วัสดุแบบ PBR (Physically Based Rendering)
    materialLibrary.manifold = new THREE.MeshStandardMaterial({ 
        color: COLORS.manifold,
        metalness: 0.9,
        roughness: 0.3,
        envMapIntensity: 1.0
    });
    
    materialLibrary.housing = new THREE.MeshStandardMaterial({ 
        color: COLORS.housing,
        metalness: 0.8,
        roughness: 0.4,
        envMapIntensity: 0.8
    });
    
    materialLibrary.pin = new THREE.MeshStandardMaterial({
        color: COLORS.pin,
        metalness: 0.95,
        roughness: 0.1,
        envMapIntensity: 1.2
    });
    
    materialLibrary.heater = new THREE.MeshStandardMaterial({
        color: COLORS.heaterValve,
        emissive: 0xff2200,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
    });
    
    // เพิ่มแผนที่ Normal และ Roughness สำหรับวัสดุโลหะ
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('textures/metal_normal.jpg', function(normalMap) {
        materialLibrary.manifold.normalMap = normalMap;
        materialLibrary.housing.normalMap = normalMap;
        materialLibrary.pin.normalMap = normalMap;
    });
    
    textureLoader.load('textures/metal_roughness.jpg', function(roughnessMap) {
        materialLibrary.manifold.roughnessMap = roughnessMap;
        materialLibrary.housing.roughnessMap = roughnessMap;
        materialLibrary.pin.roughnessMap = roughnessMap;
    });
}

// เพิ่ม Environment Map สำหรับการสะท้อนของผิววัสดุ
function setupEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    new THREE.TextureLoader().load('textures/machine_shop_env.jpg', function(texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        
        // เพิ่มการสะท้อนให้กับวัสดุทั้งหมด
        for (const key in materialLibrary) {
            if (materialLibrary[key].isMeshStandardMaterial) {
                materialLibrary[key].envMap = envMap;
            }
        }
        
        texture.dispose();
        pmremGenerator.dispose();
    });
}

// เพิ่มระบบแสงที่สมจริงยิ่งขึ้น
function setupAdvancedLighting() {
    // เพิ่มแสงแวดล้อมจากท้องฟ้า (HDRI Lighting)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 300, 0);
    scene.add(hemiLight);
    
    // เพิ่มแสงหลัก
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(50, 50, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.far = 200;
    scene.add(mainLight);
    
    // เพิ่มแสงเรืองแสงสำหรับส่วนที่ร้อน
    const glowingParts = [];
    scene.traverse((object) => {
        if (object.name && (object.name.includes('heater') || object.name.includes('tip'))) {
            glowingParts.push(object);
        }
    });
    
    glowingParts.forEach(part => {
        const pointLight = new THREE.PointLight(0xff5500, 0.8, 5);
        pointLight.position.copy(part.position);
        scene.add(pointLight);
        
        // เพิ่มเอฟเฟกต์เรืองแสง
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                "c": { type: "f", value: 0.5 },
                "p": { type: "f", value: 4.0 },
                glowColor: { type: "c", value: new THREE.Color(0xff5500) },
                viewVector: { type: "v3", value: camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normal);
                    vec3 vNormel = normalize(viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 1.0);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        // สร้าง mesh สำหรับเอฟเฟกต์เรืองแสง
        const glowGeometry = part.geometry.clone();
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.scale.multiplyScalar(1.1); // ขยายขนาดเล็กน้อย
        glowMesh.position.copy(part.position);
        glowMesh.visible = false; // จะเปิดใช้เมื่อทำแอนิเมชันเท่านั้น
        part.userData.glowMesh = glowMesh;
        scene.add(glowMesh);
    });
}
// เพิ่มฟังก์ชันเหล่านี้ในไฟล์ hot-runner-3d.js ก่อน window.HotRunnerModels

// ฟังก์ชันสำหรับรับเส้นทางการไหลของพลาสติก
function getPlasticFlowPaths(modelType) {
    if (modelType === 'valve-gate') {
        return [
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(-2, -1, 0),
                new THREE.Vector3(-1, -0.5, 0),
                new THREE.Vector3(-1, 0.65, 0)
            ],
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(2, -1, 0),
                new THREE.Vector3(1, -0.5, 0),
                new THREE.Vector3(1, 0.65, 0)
            ]
        ];
    } else if (modelType === 'thermal-gate') {
        return [
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(-2, -1, 0),
                new THREE.Vector3(-1, -0.5, 0),
                new THREE.Vector3(-1, 0.45, 0)
            ],
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(2, -1, 0),
                new THREE.Vector3(1, -0.5, 0),
                new THREE.Vector3(1, 0.45, 0)
            ]
        ];
    } else { // open-tip
        return [
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(-2, -1, 0),
                new THREE.Vector3(-1, -0.5, 0),
                new THREE.Vector3(-1, 0.05, 0)
            ],
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(2, -1, 0),
                new THREE.Vector3(1, -0.5, 0),
                new THREE.Vector3(1, 0.05, 0)
            ]
        ];
    }
}

// ฟังก์ชันสำหรับรับโมเดลตามประเภท
function getModelByType(modelType) {
    switch(modelType) {
        case 'valve-gate': return valveGateModel;
        case 'thermal-gate': return thermalGateModel;
        case 'open-tip': return openTipModel;
        default: return valveGateModel;
    }
}

// ตัวแปรสำหรับเก็บประเภทโมเดลปัจจุบัน

// แอนิเมชันการทำงานของ Hot Runner ที่สมจริงมากขึ้น
function simulateHotRunnerOperation(modelType) {
    stopAllAnimations();
    
    // เลือกโมเดลที่ถูกต้อง
    let model;
    switch(modelType) {
        case 'valve-gate':
            model = valveGateModel;
            break;
        case 'thermal-gate':
            model = thermalGateModel;
            break;
        case 'open-tip':
            model = openTipModel;
            break;
        default:
            model = valveGateModel;
    }
    
    if (!model || !model.visible) {
        showModel(modelType);
    }
    
    // เริ่มต้นขั้นตอนการทำงาน
    const timeline = gsap.timeline({
        onComplete: function() {
            // เปิดให้ทำซ้ำได้หากต้องการ
        }
    });
    
    // 1. เริ่มต้นด้วยการให้ความร้อน
    const heaters = [];
    model.traverse((object) => {
        if (object.name && object.name.includes('heater')) {
            heaters.push(object);
            
            // เปิดใช้เอฟเฟกต์เรืองแสง
            if (object.userData.glowMesh) {
                object.userData.glowMesh.visible = true;
            }
        }
    });
    
    heaters.forEach(heater => {
        // แอนิเมชันสีและความสว่างของฮีตเตอร์
        timeline.to(heater.material, {
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 1.0,
            duration: 3,
            ease: "power2.in"
        }, 0);
        
        // สั่นเล็กน้อยเพื่อจำลองการขยายตัวจากความร้อน
        const originalPosition = heater.position.clone();
        const randomOffset = 0.03;
        
        timeline.to(heater.position, {
            x: originalPosition.x + (Math.random() * randomOffset - randomOffset/2),
            y: originalPosition.y + (Math.random() * randomOffset - randomOffset/2),
            z: originalPosition.z + (Math.random() * randomOffset - randomOffset/2),
            duration: 0.2,
            ease: "power1.inOut",
            repeat: 15,
            yoyo: true
        }, 0);
    });
    
    // 2. แอนิเมชันการไหลของพลาสติก
    timeline.call(() => {
        createRealisticPlasticFlow(modelType);
    }, null, "+=1");
    
    // 3. เปิด/ปิดเข็มควบคุม (สำหรับ valve gate)
    if (modelType === 'valve-gate') {
        const pins = [];
        model.traverse((object) => {
            if (object.name && object.name.includes('pin')) {
                pins.push(object);
            }
        });
        
        pins.forEach(pin => {
            const startY = pin.position.y;
            
            // แอนิเมชันเข็มเปิด
            timeline.to(pin.position, {
                y: startY - 0.5,
                duration: 1,
                delay: 4,
                ease: "power2.inOut"
            });
            
            // แอนิเมชันเข็มปิด (หลังฉีดเสร็จ)
            timeline.to(pin.position, {
                y: startY,
                duration: 1,
                delay: 5,
                ease: "power3.out"
            });
        });
    }
    
    // 4. เอฟเฟกต์การแข็งตัวของพลาสติกและเปิดแม่พิมพ์
    timeline.call(() => {
        // หยุดการไหลของพลาสติก
        plasticParticles.forEach(particle => {
            if (particle.userData && particle.userData.animation) {
                particle.userData.animation.pause();
            }
        });
        
        // เปลี่ยนสีพลาสติกเป็นโทนเย็นเพื่อแสดงการแข็งตัว
        plasticParticles.forEach(particle => {
            gsap.to(particle.material.color, {
                r: 0.3,
                g: 0.8,
                b: 0.4,
                duration: 2,
                ease: "power1.in"
            });
        });
    }, null, "+=7");
    
    // 5. แสดงผลลัพธ์ชิ้นงานเสมือน
    timeline.call(() => {
        // สร้างชิ้นงานสำเร็จเสมือน
        createVirtualProduct(modelType);
    }, null, "+=2");
    
    return timeline;
}

// สร้างการไหลของพลาสติกที่สมจริงขึ้น
function createRealisticPlasticFlow(modelType) {
    // ลบอนุภาคเก่าออก
    plasticParticles.forEach(particle => {
        if (particle.parent) {
            particle.parent.remove(particle);
        }
    });
    plasticParticles = [];
    
    // กำหนดเส้นทางการไหลตามชนิดของ Hot Runner
    let paths = getPlasticFlowPaths(modelType);
    const model = getModelByType(modelType);
    
    // สร้างระบบอนุภาค
    const particleCount = Math.min(SETTINGS.particleCount, 300);
    const particlesPerPath = Math.floor(particleCount / paths.length);
    
    // สร้างแสง effect สำหรับการไหลของพลาสติก
    const plasticLight = new THREE.PointLight(0x00ff00, 0.3, 3);
    model.add(plasticLight);
    
    // วัสดุสำหรับอนุภาคพลาสติกที่มีการตอบสนองต่อแสง
    const plasticMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.plastic,
        emissive: 0x00aa00,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
        metalness: 0.0,
        roughness: 0.2
    });
    
    // สร้างกลุ่มอนุภาคแบบ instanced mesh เพื่อประสิทธิภาพที่ดีขึ้น
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    
    paths.forEach((path, pathIndex) => {
        // สร้าง spline curve จากเส้นทาง
        const curve = new THREE.CatmullRomCurve3(path);
        
        for (let i = 0; i < particlesPerPath; i++) {
            // สร้างอนุภาคที่มีขนาดแตกต่างกันเล็กน้อย
            const scale = 0.8 + Math.random() * 0.4;
            const particle = new THREE.Mesh(particleGeometry, plasticMaterial.clone());
            particle.scale.set(scale, scale, scale);
            
            // กำหนดตำแหน่งเริ่มต้น
            particle.position.copy(path[0]);
            model.add(particle);
            
            // เก็บอนุภาค
            plasticParticles.push(particle);
            
            // สร้างแอนิเมชันตามเส้นทาง curve
            const startDelay = Math.random() * 2;
            
            // ใช้ gsap 
            const tl = gsap.timeline({
                delay: startDelay,
                repeat: -1
            });
            
            tl.to(particle, {
                duration: 4 / SETTINGS.animationSpeed,
                ease: "none",
                onUpdate: function() {
                    // ใช้ progress ปัจจุบันเพื่อกำหนดตำแหน่งบน curve
                    const progress = this.progress();
                    const position = curve.getPointAt(progress);
                    particle.position.copy(position);
                    
                    // หมุนอนุภาคให้ดูเป็นธรรมชาติ
                    particle.rotation.x += 0.01;
                    particle.rotation.y += 0.02;
                    
                    // เคลื่อนย้ายแสงไปตามอนุภาคหลัก (แต่ไม่ทุกตัว เพื่อประสิทธิภาพ)
                    if (i === 0 && pathIndex === 0) {
                        plasticLight.position.copy(position);
                    }
                }
            });
            
            particle.userData.animation = tl;
        }
    });
    
    return plasticParticles;
}

// สร้างชิ้นงานเสมือนเพื่อแสดงผลลัพธ์
function createVirtualProduct(modelType) {
    const productGroup = new THREE.Group();
    productGroup.name = "virtual_product";
    
    // สร้างชิ้นงานจากประเภทของ Hot Runner
    let productGeometry;
    
    switch(modelType) {
        case 'valve-gate':
            // ผลิตภัณฑ์ที่มีคุณภาพสูง ผิวเรียบ
            productGeometry = new THREE.BoxGeometry(2, 0.2, 1);
            break;
        case 'thermal-gate':
            // ผลิตภัณฑ์ที่มีคุณภาพปานกลาง
            productGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
            break;
        case 'open-tip':
            // ผลิตภัณฑ์ที่อาจมีตำหนิบ้าง
            productGeometry = new THREE.SphereGeometry(1, 32, 24);
            break;
        default:
            productGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    }
    
    const productMaterial = new THREE.MeshStandardMaterial({
        color: 0x22cc44,
        metalness: 0.1,
        roughness: 0.7,
        transparent: true,
        opacity: 0.9
    });
    
    const product = new THREE.Mesh(productGeometry, productMaterial);
    product.position.set(0, 2, 0); // แสดงเหนือโมเดล
    product.castShadow = true;
    product.receiveShadow = true;
    
    productGroup.add(product);
    scene.add(productGroup);
    
    // แอนิเมชันแสดงผลิตภัณฑ์
    gsap.from(product.scale, {
        x: 0.01, y: 0.01, z: 0.01,
        duration: 1.5,
        ease: "elastic.out(1, 0.3)"
    });
    
    gsap.to(product.rotation, {
        y: Math.PI * 2,
        duration: 5,
        repeat: -1,
        ease: "none"
    });
    
    // แสดงป้ายชื่อสำหรับผลิตภัณฑ์
    createLabel("ชิ้นงานสำเร็จ", 0, 3, 0, scene);
    
    return productGroup;
}

// เพิ่มการวิเคราะห์ Thermal และการแสดงผลอุณหภูมิ
function addTemperatureVisualization() {
    // เตรียม texture สำหรับแสดงแผนที่ความร้อน
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // สร้างแผนที่สีแบบความร้อน (heat map)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0.0, '#000080'); // น้ำเงินเข้ม (เย็น)
    gradient.addColorStop(0.2, '#0000FF'); // น้ำเงิน
    gradient.addColorStop(0.4, '#00FFFF'); // ฟ้า
    gradient.addColorStop(0.6, '#FFFF00'); // เหลือง
    gradient.addColorStop(0.8, '#FF0000'); // แดง
    gradient.addColorStop(1.0, '#FF00FF'); // แดงเข้ม (ร้อน)
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const heatMapTexture = new THREE.CanvasTexture(canvas);
    
    // ฟังก์ชันสำหรับเปลี่ยนวัสดุของชิ้นส่วนเพื่อแสดงอุณหภูมิ
    return function toggleTemperatureView(show = true) {
        if (!currentModel) return;
        
        // เก็บวัสดุเดิมถ้ายังไม่ได้เก็บ
        if (show && !currentModel.userData.originalMaterials) {
            const originalMaterials = {};
            
            currentModel.traverse((object) => {
                if (object.isMesh) {
                    originalMaterials[object.uuid] = object.material;
                }
            });
            
            currentModel.userData.originalMaterials = originalMaterials;
        }
        
        currentModel.traverse((object) => {
            if (object.isMesh) {
                if (show) {
                    // กำหนดอุณหภูมิตามตำแหน่งและประเภทของชิ้นส่วน
                    let temperature = 0.0; // 0-1 (เย็น-ร้อน)
                    
                    if (object.name.includes('heater')) {
                        temperature = 0.9; // ฮีตเตอร์ร้อนมาก
                    } else if (object.name.includes('tip')) {
                        temperature = 0.8; // ปลายทิพร้อน
                    } else if (object.name.includes('manifold')) {
                        temperature = 0.7; // manifold ร้อน
                    } else if (object.name.includes('pipe')) {
                        temperature = 0.6; // ท่อร้อนปานกลาง
                    } else if (object.name.includes('housing')) {
                        temperature = 0.5; // housing ร้อนปานกลาง
                    } else if (object.name.includes('pin')) {
                        // เข็มมีความร้อนลดหลั่นจากฐานไปปลาย
                        const normalizedY = (object.position.y + 1) / 2; // -1 to 1 -> 0 to 1
                        temperature = 0.6 - normalizedY * 0.4; // ร้อนที่ฐาน เย็นที่ปลาย
                    } else {
                        temperature = 0.2; // ชิ้นส่วนอื่นๆ เย็น
                    }
                    
                    // สร้างวัสดุแสดงอุณหภูมิ
                    const heatMaterial = new THREE.MeshBasicMaterial({
                        map: heatMapTexture,
                        transparent: false
                    });
                    
                    // ปรับ offset ใน texture ตามอุณหภูมิ
                    heatMaterial.map.offset.x = temperature;
                    heatMaterial.needsUpdate = true;
                    
                    // ใช้วัสดุแสดงอุณหภูมิ
                    object.material = heatMaterial;
                } else {
                    // คืนค่าวัสดุเดิม
                    if (currentModel.userData.originalMaterials && 
                        currentModel.userData.originalMaterials[object.uuid]) {
                        object.material = currentModel.userData.originalMaterials[object.uuid];
                    }
                }
            }
        });
    };
}

// เพิ่มการวิเคราะห์การไหลและแรงดัน
function addFlowAnalysisVisualization() {
    // สร้าง helper object สำหรับแสดงเวกเตอร์ทิศทางการไหล
    const flowArrows = new THREE.Group();
    scene.add(flowArrows);
    
    return function toggleFlowAnalysis(show = true) {
        // ลบลูกศรเก่าออก
        while (flowArrows.children.length > 0) {
            flowArrows.remove(flowArrows.children[0]);
        }
        
        if (!show || !currentModel) return;
        
        // กำหนดตำแหน่งสำหรับการวิเคราะห์
        let flowPoints = [];
        
        // ค้นหาเส้นทางการไหล
        const pipes = [];
        const tips = [];
        let manifold = null;
        let sprue = null;
        
        currentModel.traverse((object) => {
            if (object.name && object.name.includes('pipe')) {
                pipes.push(object);
            } else if (object.name && object.name.includes('tip')) {
                tips.push(object);
            } else if (object.name && object.name.includes('manifold')) {
                manifold = object;
            } else if (object.name && object.name.includes('sprue')) {
                sprue = object;
            }
        });
        
        // สร้างจุดวิเคราะห์การไหล
        if (sprue) {
            flowPoints.push({
                position: sprue.position.clone(),
                direction: new THREE.Vector3(0, 1, 0),
                pressure: 0.9, // แรงดันสูงที่จุดเข้า
                speed: 0.7
            });
        }
        
        if (manifold) {
            flowPoints.push({
                position: manifold.position.clone(),
                direction: new THREE.Vector3(1, 0, 0),
                pressure: 0.8,
                speed: 0.8
            });
            
            flowPoints.push({
                position: new THREE.Vector3(manifold.position.x - 1, manifold.position.y, manifold.position.z),
                direction: new THREE.Vector3(0, 1, 0),
                pressure: 0.7,
                speed: 0.85
            });
            
            flowPoints.push({
                position: new THREE.Vector3(manifold.position.x + 1, manifold.position.y, manifold.position.z),
                direction: new THREE.Vector3(0, 1, 0),
                pressure: 0.7,
                speed: 0.85
            });
        }
        
        // เพิ่มจุดที่ตำแหน่งปลายทิพ
        tips.forEach(tip => {
            flowPoints.push({
                position: tip.position.clone(),
                direction: new THREE.Vector3(0, 1, 0),
                pressure: 0.3, // แรงดันลดลงที่ปลายทาง
                speed: 1.0 // ความเร็วสูงที่ปลายทาง
            });
        });
        
        // สร้างลูกศรแสดงทิศทางการไหล
        const arrowHelper = new THREE.ArrowHelper();
        
        flowPoints.forEach(point => {
            // สร้างลูกศรตามทิศทางการไหล
            const length = 0.5 * point.speed;
            const arrowSize = 0.1 * point.speed;
            
            // สีตามแรงดัน: แดง (สูง) -> น้ำเงิน (ต่ำ)
            const color = new THREE.Color();
            color.setHSL(0.66 * (1 - point.pressure), 1, 0.5);
            
            const arrow = new THREE.ArrowHelper(
                point.direction.normalize(),
                point.position,
                length,
                color,
                arrowSize,
                arrowSize * 0.7
            );
            
            flowArrows.add(arrow);
            
            // เพิ่มข้อความแสดงค่าแรงดัน
            const pressureValue = Math.round(point.pressure * 200); // เปลี่ยนเป็น MPa สมมติ
            createDataLabel(`${pressureValue} MPa`, point.position.x, point.position.y + 0.2, point.position.z, flowArrows);
        });
        
        return flowArrows;
    };
}

// สร้างป้ายข้อมูลสำหรับการวิเคราะห์
function createDataLabel(text, x, y, z, parent) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    
    // วาดพื้นหลัง
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // วาดขอบ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // วาดข้อความ
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // สร้าง texture
    // สร้าง texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // สร้าง sprite
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.25, 1);
    sprite.position.set(x, y, z);
    
    if (parent) {
        parent.add(sprite);
    } else {
        scene.add(sprite);
    }
    
    return sprite;
}
// เพิ่มระบบจำลองปัญหาและการแก้ไข
function simulateMoldingDefects() {
    const defects = {
        shortShot: {
            name: "การฉีดไม่เต็ม (Short Shot)",
            description: "พลาสติกไม่ไหลเข้าเต็มแม่พิมพ์ ทำให้ชิ้นงานไม่สมบูรณ์",
            causes: [
                "อุณหภูมิพลาสติกต่ำเกินไป",
                "แรงดันฉีดต่ำเกินไป",
                "ความเร็วในการฉีดต่ำเกินไป"
            ],
            solutions: [
                "เพิ่มอุณหภูมิของ Hot Runner",
                "เพิ่มแรงดันในการฉีด",
                "เพิ่มความเร็วในการฉีด"
            ],
            simulate: function() {
                // แสดงแอนิเมชันการฉีดไม่เต็ม
                createRealisticPlasticFlow(currentModelType, 0.5); // 50% ของการไหลปกติ
                
                // สร้างชิ้นงานที่ไม่สมบูรณ์
                const product = createDefectiveProduct('shortShot');
                return product;
            }
        },
        
        sinkMarks: {
            name: "รอยยุบ (Sink Marks)",
            description: "เกิดรอยบุ๋มบนผิวชิ้นงานเนื่องจากการหดตัวของพลาสติก",
            causes: [
                "อุณหภูมิหลอมเหลวสูงเกินไป",
                "แรงดันยืนยันไม่เพียงพอ",
                "เวลาในการเย็นตัวไม่เพียงพอ"
            ],
            solutions: [
                "ลดอุณหภูมิของ Hot Runner",
                "เพิ่มแรงดันยืนยัน (Holding Pressure)",
                "เพิ่มเวลาในการเย็นตัว"
            ],
            simulate: function() {
                // ทำงานปกติแต่สร้างชิ้นงานที่มีรอยยุบ
                createRealisticPlasticFlow(currentModelType);
                
                const product = createDefectiveProduct('sinkMarks');
                return product;
            }
        },
        
        weldLines: {
            name: "รอยเชื่อม (Weld Lines)",
            description: "เส้นหรือรอยที่เกิดจากการไหลมาบรรจบกันของพลาสติก",
            causes: [
                "อุณหภูมิ Hot Runner ไม่สม่ำเสมอ",
                "ความเร็วในการฉีดไม่เหมาะสม",
                "การออกแบบ Gate ไม่เหมาะสม"
            ],
            solutions: [
                "ปรับอุณหภูมิให้สม่ำเสมอทั่วทั้ง Hot Runner",
                "ปรับความเร็วในการฉีด",
                "ปรับตำแหน่งหรือขนาดของ Gate"
            ],
            simulate: function() {
                // แสดงการไหลที่ไม่สม่ำเสมอ
                const flowViz = createRealisticPlasticFlow(currentModelType);
                
                // ทำให้พลาสติกแต่ละฝั่งมีสีแตกต่างกันเล็กน้อย
                flowViz.forEach((particle, index) => {
                    if (index % 2 === 0) {
                        particle.material.color.setHex(0x22cc44); // สีเขียว
                    } else {
                        particle.material.color.setHex(0x22cc88); // สีเขียวอ่อน
                    }
                });
                
                const product = createDefectiveProduct('weldLines');
                return product;
            }
        },
        
        burning: {
            name: "รอยไหม้ (Burning)",
            description: "พลาสติกไหม้เนื่องจากอุณหภูมิสูงเกินไป ทำให้เกิดรอยดำบนชิ้นงาน",
            causes: [
                "อุณหภูมิ Hot Runner สูงเกินไป",
                "ความเร็วในการฉีดสูงเกินไป",
                "อากาศติดในแม่พิมพ์"
            ],
            solutions: [
                "ลดอุณหภูมิของ Hot Runner",
                "ลดความเร็วในการฉีด",
                "เพิ่มช่องระบายอากาศในแม่พิมพ์"
            ],
            simulate: function() {
                // เพิ่มอุณหภูมิสูงเกินไป
                const heaters = [];
                currentModel.traverse((object) => {
                    if (object.name && object.name.includes('heater')) {
                        heaters.push(object);
                        
                        // แสดงการร้อนเกินไป
                        gsap.to(object.material, {
                            emissive: new THREE.Color(0xff0000),
                            emissiveIntensity: 2.0,
                            duration: 1
                        });
                    }
                });
                
                // พลาสติกสีเข้มผิดปกติ
                createRealisticPlasticFlow(currentModelType);
                plasticParticles.forEach(particle => {
                    gsap.to(particle.material.color, {
                        r: 0.1,
                        g: 0.05,
                        b: 0.0,
                        duration: 2
                    });
                });
                
                const product = createDefectiveProduct('burning');
                return product;
            }
        }
    };
    
    // สร้างชิ้นงานที่มีปัญหา
    function createDefectiveProduct(defectType) {
        const productGroup = new THREE.Group();
        productGroup.name = "defective_product";
        
        let productGeometry;
        
        switch(currentModelType) {
            case 'valve-gate':
                productGeometry = new THREE.BoxGeometry(2, 0.2, 1);
                break;
            case 'thermal-gate':
                productGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
                break;
            case 'open-tip':
                productGeometry = new THREE.SphereGeometry(1, 32, 24);
                break;
            default:
                productGeometry = new THREE.BoxGeometry(2, 0.2, 1);
        }
        
        // วัสดุพื้นฐานสำหรับผลิตภัณฑ์
        const productMaterial = new THREE.MeshStandardMaterial({
            color: 0x22cc44,
            metalness: 0.1,
            roughness: 0.7,
            transparent: true,
            opacity: 0.9
        });
        
        const product = new THREE.Mesh(productGeometry, productMaterial);
        product.position.set(0, 2, 0);
        product.castShadow = true;
        product.receiveShadow = true;
        
        // จำลองปัญหาเฉพาะสำหรับแต่ละประเภท
        switch(defectType) {
            case 'shortShot':
                // ทำให้ชิ้นงานไม่สมบูรณ์โดยการกำหนดขนาดเล็กลง
                product.scale.set(0.7, 1, 0.7);
                break;
                
            case 'sinkMarks':
                // เพิ่มรอยบุ๋มบนผิว
                const sinkGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const sinkMaterial = new THREE.MeshStandardMaterial({
                    color: 0x22cc44,
                    metalness: 0.1,
                    roughness: 0.7,
                    transparent: true,
                    opacity: 0.9
                });

                // เพิ่มรอยยุบหลายจุด
                for (let i = 0; i < 5; i++) {
                    const sink = new THREE.Mesh(sinkGeometry, sinkMaterial);
                    
                    // ตำแหน่งแบบสุ่มบนผิวชิ้นงาน
                    let x, y, z;
                    
                    if (currentModelType === 'valve-gate') {
                        x = Math.random() * 1.6 - 0.8;
                        y = 0.12; // บนผิวบน
                        z = Math.random() * 0.8 - 0.4;
                    } else if (currentModelType === 'thermal-gate') {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 0.8;
                        x = Math.cos(angle) * radius;
                        y = 0.12;
                        z = Math.sin(angle) * radius;
                    } else {
                        // สุ่มจุดบนทรงกลม
                        const phi = Math.random() * Math.PI * 2;
                        const theta = Math.random() * Math.PI;
                        x = Math.sin(theta) * Math.cos(phi) * 0.9;
                        y = Math.sin(theta) * Math.sin(phi) * 0.9;
                        z = Math.cos(theta) * 0.9;
                    }
                    
                    sink.position.set(x, y, z);
                    // ใช้ scale เป็นลบเพื่อทำให้เป็นรอยบุ๋มแทนที่จะนูนออกมา
                    sink.scale.set(-1, -1, -1);
                    product.add(sink);
                }
                break;
                
            case 'weldLines':
                // เพิ่มเส้นรอยเชื่อมบนผิว
                if (currentModelType === 'valve-gate' || currentModelType === 'thermal-gate') {
                    // สร้างเส้นรอยเชื่อม
                    const lineGeometry = new THREE.PlaneGeometry(1.8, 0.02);
                    const lineMaterial = new THREE.MeshBasicMaterial({
                        color: 0x11aa33,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    const line = new THREE.Mesh(lineGeometry, lineMaterial);
                    line.position.set(0, 0.101, 0); // เหนือผิวเล็กน้อย
                    line.rotation.x = -Math.PI / 2;
                    product.add(line);
                } else {
                    // สร้างเส้นรอยเชื่อมบนทรงกลม
                    const curve = new THREE.EllipseCurve(
                        0, 0,             // center x, y
                        0.9, 0.9,         // xRadius, yRadius
                        0, Math.PI * 2,   // startAngle, endAngle
                        false,            // clockwise
                        0                 // rotation
                    );
                    
                    const points = curve.getPoints(50);
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x11aa33 });
                    
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    line.rotateX(Math.PI / 2);
                    product.add(line);
                }
                break;
                
            case 'burning':
                // เพิ่มรอยไหม้บนชิ้นงาน
                const burnGeometry = new THREE.PlaneGeometry(0.3, 0.3);
                const burnMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.8
                });
                
                // เพิ่มจุดไหม้หลายจุด
                for (let i = 0; i < 3; i++) {
                    const burn = new THREE.Mesh(burnGeometry, burnMaterial);
                    
                    // ตำแหน่งแบบสุ่มบนผิวชิ้นงาน
                    let x, y, z;
                    
                    if (currentModelType === 'valve-gate') {
                        x = Math.random() * 1.6 - 0.8;
                        y = 0.101; // บนผิวบน
                        z = Math.random() * 0.8 - 0.4;
                        burn.rotation.x = -Math.PI / 2;
                    } else if (currentModelType === 'thermal-gate') {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 0.8;
                        x = Math.cos(angle) * radius;
                        y = 0.101;
                        z = Math.sin(angle) * radius;
                        burn.rotation.x = -Math.PI / 2;
                    } else {
                        // สุ่มจุดบนทรงกลม
                        const phi = Math.random() * Math.PI * 2;
                        const theta = Math.random() * Math.PI;
                        x = Math.sin(theta) * Math.cos(phi) * 0.9;
                        y = Math.sin(theta) * Math.sin(phi) * 0.9;
                        z = Math.cos(theta) * 0.9;
                        
                        // ตั้ง rotation ให้แนบกับผิวทรงกลม
                        burn.position.set(x, y, z);
                        burn.lookAt(0, 0, 0);
                        product.add(burn);
                        continue;
                    }
                    
                    burn.position.set(x, y, z);
                    product.add(burn);
                }
                break;
        }
        
        productGroup.add(product);
        scene.add(productGroup);
        
        // แสดงข้อความอธิบายปัญหา
        const defectData = defects[defectType];
        const infoPanel = document.getElementById('part-info');
        
        if (infoPanel && defectData) {
            let html = `<h4>${defectData.name}</h4>`;
            html += `<p>${defectData.description}</p>`;
            
            html += `<h5>สาเหตุ:</h5><ul>`;
            defectData.causes.forEach(cause => {
                html += `<li>${cause}</li>`;
            });
            html += `</ul>`;
            
            html += `<h5>การแก้ไข:</h5><ul>`;
            defectData.solutions.forEach(solution => {
                html += `<li>${solution}</li>`;
            });
            html += `</ul>`;
            
            infoPanel.innerHTML = html;
        }
        
        return productGroup;
    }
    
    // เปิดเผยให้ใช้จากภายนอก
    return {
        simulateDefect: function(defectType) {
            if (defects[defectType]) {
                // ลบชิ้นงานเก่าออกก่อน
                scene.traverse((object) => {
                    if (object.name === "virtual_product" || object.name === "defective_product") {
                        scene.remove(object);
                    }
                });
                
                return defects[defectType].simulate();
            }
            return null;
        },
        getDefectTypes: function() {
            return Object.keys(defects);
        },
        getDefectInfo: function(defectType) {
            return defects[defectType];
        }
    };
}
// ปรับปรุงการควบคุมมุมมองกล้องให้สมจริงมากขึ้น
function setupAdvancedCameraControls() {
    // เพิ่มมุมมองสำเร็จรูป
    const presetViews = {
        front: { position: new THREE.Vector3(0, 0, 5), target: new THREE.Vector3(0, 0, 0) },
        side: { position: new THREE.Vector3(5, 0, 0), target: new THREE.Vector3(0, 0, 0) },
        top: { position: new THREE.Vector3(0, 5, 0), target: new THREE.Vector3(0, 0, 0) },
        isometric: { position: new THREE.Vector3(3, 3, 3), target: new THREE.Vector3(0, 0, 0) },
        closeupTipLeft: { position: new THREE.Vector3(-1.5, 0.5, 1), target: new THREE.Vector3(-1, 0.5, 0) },
        closeupTipRight: { position: new THREE.Vector3(1.5, 0.5, 1), target: new THREE.Vector3(1, 0.5, 0) },
        crossSection: { position: new THREE.Vector3(0, 0, 5), target: new THREE.Vector3(0, 0, 0) }
    };
    
    // เพิ่มความสามารถในการเปลี่ยนไปยังมุมมองที่กำหนดไว้ล่วงหน้า
    function setCameraView(viewName, duration = 1.5) {
        if (!presetViews[viewName]) return;
        
        const view = presetViews[viewName];
        
        // แอนิเมชันการเคลื่อนที่ของกล้อง
        gsap.to(camera.position, {
            x: view.position.x,
            y: view.position.y,
            z: view.position.z,
            duration: duration,
            ease: "power2.inOut",
            onUpdate: function() {
                // มองไปที่เป้าหมายตลอดการเคลื่อนที่
                camera.lookAt(view.target);
            },
            onComplete: function() {
                // ตั้งค่าการควบคุมให้มองที่เป้าหมาย
                controls.target.copy(view.target);
                controls.update();
                
                // ถ้าเป็นมุมมองภาคตัดขวาง
                if (viewName === 'crossSection') {
                    toggleCrossSectionView(true);
                } else {
                    toggleCrossSectionView(false);
                }
            }
        });
    }
    
    // เพิ่มความสามารถในการตัดขวางโมเดล
    let clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    let crossSectionMode = false;
    
    function toggleCrossSectionView(enabled) {
        if (!currentModel) return;
        
        crossSectionMode = enabled;
        
        if (enabled) {
            // เปิดใช้งานการตัดขวาง
            renderer.localClippingEnabled = true;
            
            currentModel.traverse((object) => {
                if (object.isMesh) {
                    if (!object.userData.originalMaterial) {
                        object.userData.originalMaterial = object.material;
                    }
                    
                    // คัดลอกวัสดุและเพิ่มการตัดขวาง
                    const material = object.userData.originalMaterial.clone();
                    material.clippingPlanes = [clipPlane];
                    material.clipShadows = true;
                    material.side = THREE.DoubleSide; // แสดงทั้งด้านในและด้านนอก
                    
                    // เพิ่มสีขอบสำหรับจุดที่ถูกตัด
                    material.clippingPlanesIntersection = true;
                    material.clipIntersection = false;
                    
                    object.material = material;
                }
            });
            
            // เพิ่มแถบควบคุมสำหรับเลื่อนระนาบตัดขวาง
            if (!document.getElementById('cross-section-control')) {
                const controlDiv = document.createElement('div');
                controlDiv.id = 'cross-section-control';
                controlDiv.style.position = 'absolute';
                controlDiv.style.bottom = '20px';
                controlDiv.style.width = '100%';
                controlDiv.style.textAlign = 'center';
                controlDiv.innerHTML = `
                    <label for="clip-slider">เลื่อนระนาบตัดขวาง:</label>
                    <input type="range" id="clip-slider" min="-2" max="2" step="0.01" value="0">
                `;
                
                document.getElementById('three-js-container').appendChild(controlDiv);
                
                // เพิ่ม event listener
                document.getElementById('clip-slider').addEventListener('input', function(e) {
                    const value = parseFloat(e.target.value);
                    clipPlane.constant = value;
                });
            } else {
                document.getElementById('cross-section-control').style.display = 'block';
            }
        } else {
            // ปิดการใช้งานการตัดขวาง
            renderer.localClippingEnabled = false;
            
            // คืนค่าวัสดุเดิม
            currentModel.traverse((object) => {
                if (object.isMesh && object.userData.originalMaterial) {
                    object.material = object.userData.originalMaterial;
                }
            });
            
            // ซ่อนแถบควบคุม
            const controlDiv = document.getElementById('cross-section-control');
            if (controlDiv) {
                controlDiv.style.display = 'none';
            }
        }
    }
    
    // เพิ่มความสามารถในการซูมเข้าชิ้นส่วนที่เลือก
    function zoomToObject(object, offset = 2) {
        if (!object) return;
        
        // คำนวณ bounding box
        const boundingBox = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        // คำนวณระยะทาง
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * offset;
        
        // กำหนดทิศทางการมอง
        const direction = new THREE.Vector3()
            .subVectors(camera.position, center)
            .normalize();
        
        // กำหนดตำแหน่งใหม่
        const newPosition = new THREE.Vector3()
            .copy(center)
            .add(direction.multiplyScalar(cameraDistance));
        
        // แอนิเมชันการเคลื่อนที่
        gsap.to(camera.position, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: function() {
                camera.lookAt(center);
            },
            onComplete: function() {
                controls.target.copy(center);
                controls.update();
            }
        });
    }
    
    // ปรับปรุงฟังก์ชัน onMouseClick
    function enhancedMouseClick(event) {
        if (!raycaster || !mouse) return;
        
        const container = document.getElementById('three-js-container');
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            
            // แสดงข้อมูลของชิ้นส่วน
            showPartInfo(selectedObject);
            
            // ไฮไลท์ชิ้นส่วนที่เลือก
            highlightSelectedPart(selectedObject);
            
            // ซูมเข้าไปที่ชิ้นส่วนที่เลือก (เมื่อดับเบิลคลิก)
            if (event.detail === 2) { // ดับเบิลคลิก
                zoomToObject(selectedObject);
            }
        }
    }
    
    return {
        setCameraView,
        toggleCrossSectionView,
        zoomToObject,
        enhancedMouseClick
    };
}
// เพิ่มระบบเปรียบเทียบประสิทธิภาพของแต่ละระบบ Hot Runner
function createPerformanceComparisonSystem() {
    // ข้อมูลประสิทธิภาพของแต่ละระบบ
    const performanceData = {
        'valve-gate': {
            cycletime: 95, // เปอร์เซ็นต์ประสิทธิภาพเทียบกับค่าสูงสุด
            qualityControl: 98,
            maintenance: 75,
            cost: 60, // ค่าใช้จ่ายสูง = ประสิทธิภาพต่ำ
            versatility: 90
        },
        'thermal-gate': {
            cycletime: 85,
            qualityControl: 80,
            maintenance: 85,
            cost: 75,
            versatility: 80
        },
        'open-tip': {
            cycletime: 75,
            qualityControl: 65,
            maintenance: 95,
            cost: 90,
            versatility: 70
        }
    };

    // สร้างกราฟเรดาร์เปรียบเทียบ
    function createPerformanceRadarChart() {
        // ลบกราฟเก่า
        const oldChart = document.getElementById('performance-chart');
        if (oldChart) {
            oldChart.remove();
        }
        
        // สร้างพื้นที่สำหรับกราฟ
        const chartContainer = document.createElement('div');
        chartContainer.id = 'performance-chart';
        chartContainer.style.position = 'absolute';
        chartContainer.style.bottom = '20px';
        chartContainer.style.right = '20px';
        chartContainer.style.width = '250px';
        chartContainer.style.height = '250px';
        chartContainer.style.background = 'rgba(255, 255, 255, 0.85)';
        chartContainer.style.borderRadius = '10px';
        chartContainer.style.padding = '10px';
        chartContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
        
        document.getElementById('three-js-container').appendChild(chartContainer);
        
        // สร้าง canvas สำหรับกราฟ
        const canvas = document.createElement('canvas');
        canvas.width = 230;
        canvas.height = 230;
        chartContainer.appendChild(canvas);
        
        // สร้างกราฟด้วย Chart.js
        const ctx = canvas.getContext('2d');
        
        // ลำดับสีสำหรับแต่ละระบบ
        const colors = {
           'valve-gate': 'rgba(255, 99, 132, 0.7)',
            'thermal-gate': 'rgba(54, 162, 235, 0.7)',
            'open-tip': 'rgba(75, 192, 192, 0.7)'
        };
        
        // เตรียมข้อมูลสำหรับกราฟ
        const chartData = {
            labels: ['เวลาการผลิต', 'คุณภาพชิ้นงาน', 'การบำรุงรักษา', 'ต้นทุน', 'ความหลากหลาย'],
            datasets: []
        };
        
        // เพิ่มข้อมูลของแต่ละระบบ
        Object.keys(performanceData).forEach(type => {
            const data = performanceData[type];
            
            chartData.datasets.push({
                label: getSystemNameThai(type),
                data: [data.cycletime, data.qualityControl, data.maintenance, data.cost, data.versatility],
                backgroundColor: colors[type],
                borderColor: colors[type].replace('0.7', '1'),
                borderWidth: 1,
                pointBackgroundColor: colors[type].replace('0.7', '1'),
                pointRadius: 4
            });
        });
        
        // สร้างกราฟ
        const radarChart = new Chart(ctx, {
            type: 'radar',
            data: chartData,
            options: {
                responsive: true,
                scale: {
                    ticks: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'การเปรียบเทียบประสิทธิภาพ',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });
        
        return radarChart;
    }
    
    // แปลงชื่อประเภทเป็นภาษาไทย
    function getSystemNameThai(type) {
        switch(type) {
            case 'valve-gate': return 'ระบบ Valve Gate';
            case 'thermal-gate': return 'ระบบ Thermal Gate';
            case 'open-tip': return 'ระบบ Open Tip';
            default: return type;
        }
    }
    
    // ฟังก์ชันสร้างแอนิเมชันเปรียบเทียบประสิทธิภาพ
    function animatePerformanceComparison() {
        const types = Object.keys(performanceData);
        const modelNames = types.map(getSystemNameThai);
        
        // ลบชิ้นงานเก่าออกก่อน
        scene.traverse((object) => {
            if (object.name === "virtual_product" || object.name === "defective_product") {
                scene.remove(object);
            }
        });
        
        // เพิ่มส่วนแสดงผลการเปรียบเทียบ
        const infoPanel = document.getElementById('part-info');
        if (infoPanel) {
            let html = '<h4>การเปรียบเทียบประสิทธิภาพระบบ Hot Runner</h4>';
            html += '<table style="width:100%">';
            html += '<tr><th>คุณสมบัติ</th>';
            
            types.forEach(type => {
                html += `<th>${getSystemNameThai(type)}</th>`;
            });
            
            html += '</tr>';
            
            // แถวข้อมูล
            const properties = [
                { key: 'cycletime', name: 'เวลาการผลิต' },
                { key: 'qualityControl', name: 'คุณภาพชิ้นงาน' },
                { key: 'maintenance', name: 'การบำรุงรักษา' },
                { key: 'cost', name: 'ต้นทุน (ต่ำดีกว่า)' },
                { key: 'versatility', name: 'ความหลากหลายการใช้งาน' }
            ];
            
            properties.forEach(prop => {
                html += `<tr><td>${prop.name}</td>`;
                
                types.forEach(type => {
                    const value = performanceData[type][prop.key];
                    let starRating = '';
                    
                    // แสดงเป็นดาว
                    const stars = Math.round(value / 20); // 100% = 5 ดาว
                    for (let i = 0; i < 5; i++) {
                        if (i < stars) {
                            starRating += '★';
                        } else {
                            starRating += '☆';
                        }
                    }
                    
                    html += `<td>${starRating} (${value}%)</td>`;
                });
                
                html += '</tr>';
            });
            
            html += '</table>';
            
            // เพิ่มคำอธิบาย
            html += '<h5>คำอธิบายเพิ่มเติม:</h5>';
            html += '<ul>';
            html += '<li><strong>Valve Gate</strong>: ประสิทธิภาพสูงสุดด้านคุณภาพชิ้นงาน เหมาะสำหรับงานที่ต้องการความแม่นยำสูง แต่มีต้นทุนสูงและการบำรุงรักษาซับซ้อน</li>';
            html += '<li><strong>Thermal Gate</strong>: สมดุลด้านประสิทธิภาพและต้นทุน เหมาะสำหรับงานทั่วไปที่ต้องการคุณภาพดี</li>';
            html += '<li><strong>Open Tip</strong>: ต้นทุนต่ำและบำรุงรักษาง่าย แต่คุณภาพชิ้นงานและรอบเวลาการผลิตด้อยกว่า เหมาะสำหรับชิ้นงานที่ไม่ต้องการคุณภาพสูง</li>';
            html += '</ul>';
            
            infoPanel.innerHTML = html;
        }
        
        // สร้างกราฟเรดาร์
        createPerformanceRadarChart();
        
        // สร้างชิ้นงานตัวอย่างของแต่ละระบบ
        const products = [];
        types.forEach((type, index) => {
            // แสดงแต่ละโมเดลเพื่อสร้างชิ้นงานตัวอย่าง
            showModel(type);
            currentModelType = type;
            
            // สร้างชิ้นงานตัวอย่าง
            const productGeometry = type === 'valve-gate' ? 
                new THREE.BoxGeometry(1, 0.2, 0.5) : 
                type === 'thermal-gate' ? 
                    new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32) : 
                    new THREE.SphereGeometry(0.5, 32, 24);
            
            const quality = performanceData[type].qualityControl / 100;
            
            // ปรับความละเอียดตามคุณภาพ
            const roughness = 1 - quality;
            const color = new THREE.Color(0.2, 0.7 + (quality * 0.3), 0.2);
            
            const productMaterial = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.1,
                roughness: 0.3 + (roughness * 0.5),
                transparent: false
            });
            
            const product = new THREE.Mesh(productGeometry, productMaterial);
            
            // ตำแหน่งชิ้นงานตัวอย่าง
            const spacing = 3;
            product.position.set((index - 1) * spacing, 2, -2);
            product.castShadow = true;
            product.receiveShadow = true;
            product.name = `sample_product_${type}`;
            
            products.push(product);
            scene.add(product);
            
            // เพิ่มป้ายชื่อ
            const label = createLabel(getSystemNameThai(type), (index - 1) * spacing, 3, -2, scene);
            label.visible = true;
        });
        
        // แอนิเมชันหมุนชิ้นงานตัวอย่าง
        products.forEach(product => {
            gsap.to(product.rotation, {
                y: Math.PI * 2,
                duration: 5,
                repeat: -1,
                ease: "none"
            });
        });
        
        // แสดงโมเดลล่าสุดอีกครั้ง
        showModel(currentModelType || 'valve-gate');
        
        return products;
    }
    
    // เปิดเผยฟังก์ชันสำหรับใช้งาน
    return {
        createPerformanceRadarChart,
        animatePerformanceComparison,
        getPerformanceData: () => performanceData
    };
}
// เพิ่มระบบการวัดและแสดงผลพารามิเตอร์สำคัญในการทำงาน
function createParameterMonitoringSystem() {
    // สร้างแผงควบคุมสำหรับแสดงพารามิเตอร์
    const controlPanel = document.createElement('div');
    controlPanel.id = 'parameters-panel';
    controlPanel.style.position = 'absolute';
    controlPanel.style.top = '20px';
    controlPanel.style.right = '20px';
    controlPanel.style.width = '240px';
    controlPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    controlPanel.style.color = 'white';
    controlPanel.style.padding = '10px';
    controlPanel.style.borderRadius = '5px';
    controlPanel.style.fontFamily = 'Arial, sans-serif';
    controlPanel.style.fontSize = '14px';
    controlPanel.style.zIndex = '100';
    controlPanel.style.display = 'none'; // ซ่อนไว้ก่อน
    
    controlPanel.innerHTML = `
        <h3 style="margin: 0 0 10px 0; text-align: center;">พารามิเตอร์ระบบ</h3>
        <div class="parameter">
            <label for="temperature">อุณหภูมิ (°C):</label>
            <input type="range" id="temperature" min="150" max="350" value="220" style="width: 100%;">
            <span id="temperature-value">220°C</span>
        </div>
        <div class="parameter">
            <label for="pressure">แรงดัน (MPa):</label>
            <input type="range" id="pressure" min="50" max="200" value="120" style="width: 100%;">
            <span id="pressure-value">120 MPa</span>
        </div>
        <div class="parameter">
            <label for="flow-rate">อัตราการไหล (cm³/s):</label>
            <input type="range" id="flow-rate" min="10" max="100" value="50" style="width: 100%;">
            <span id="flow-rate-value">50 cm³/s</span>
        </div>
        <div class="parameter">
            <label for="cooling-time">เวลาเย็นตัว (s):</label>
            <input type="range" id="cooling-time" min="5" max="30" value="15" style="width: 100%;">
            <span id="cooling-time-value">15 s</span>
        </div>
        <div class="parameter">
            <label for="cycle-time">รอบเวลา (s):</label>
            <input type="text" id="cycle-time" value="25" readonly style="width: 50px; background: #333; color: white; border: none; text-align: center;">
        </div>
        <div style="margin-top: 10px; text-align: center;">
            <button id="apply-params" style="padding: 5px 10px; background: #3366cc; color: white; border: none; border-radius: 3px; cursor: pointer;">นำไปใช้</button>
            <button id="reset-params" style="padding: 5px 10px; background: #cc3333; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px;">รีเซ็ต</button>
        </div>
    `;
    
    document.getElementById('three-js-container').appendChild(controlPanel);
    
    // สร้างปุ่มเปิด/ปิดแผงควบคุม
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-params';
    toggleButton.textContent = 'แสดงพารามิเตอร์';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '20px';
    toggleButton.style.right = '20px';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.background = '#3366cc';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.zIndex = '101';
    
    document.getElementById('three-js-container').appendChild(toggleButton);
    
    // ตั้งค่าค่าเริ่มต้นและฟังก์ชันอัปเดต
    let parameters = {
        temperature: 220,
        pressure: 120,
        flowRate: 50,
        coolingTime: 15,
        cycleTime: 25
    };
    
    const defaultParams = { ...parameters };
    
    // ฟังก์ชันอัปเดตค่าพารามิเตอร์
    function updateParameters() {
        // อัปเดตค่าที่แสดง
        document.getElementById('temperature-value').textContent = `${parameters.temperature}°C`;
        document.getElementById('pressure-value').textContent = `${parameters.pressure} MPa`;
        document.getElementById('flow-rate-value').textContent = `${parameters.flowRate} cm³/s`;
        document.getElementById('cooling-time-value').textContent = `${parameters.coolingTime} s`;
        
        // คำนวณรอบเวลาทั้งหมด (อย่างง่าย)
        parameters.cycleTime = Math.round(
            5 + // เวลาปิดแม่พิมพ์
            (parameters.flowRate < 30 ? 10 : parameters.flowRate < 60 ? 7 : 5) + // เวลาฉีด
            parameters.coolingTime // เวลาเย็นตัว
        );
        
        document.getElementById('cycle-time').value = parameters.cycleTime;
        
        // ปรับค่าความเร็วของแอนิเมชัน
        SETTINGS.animationSpeed = parameters.flowRate / 50; // ปรับความเร็วตามอัตราการไหล
        
        // เปลี่ยนสีและความเข้มของฮีตเตอร์ตามอุณหภูมิ
        if (currentModel) {
            currentModel.traverse((object) => {
                if (object.name && object.name.includes('heater')) {
                    const normalizedTemp = (parameters.temperature - 150) / 200; // 150-350 -> 0-1
                    
                    if (object.material) {
                        // ปรับสีตามอุณหภูมิ (น้ำเงิน -> เหลือง -> แดง -> ขาว)
                        let color = new THREE.Color();
                        
                        if (normalizedTemp < 0.25) {
                            color.setHSL(0.6, 1, 0.5 + normalizedTemp); // น้ำเงิน -> ฟ้า
                        } else if (normalizedTemp < 0.5) {
                            color.setHSL(0.3 - (normalizedTemp - 0.25) * 1.2, 1, 0.6); // ฟ้าอ่อน -> เหลือง
                        } else if (normalizedTemp < 0.75) {
                            color.setHSL(0, 1, 0.6 + (normalizedTemp - 0.5) * 0.8); // เหลือง -> แดง
                        } else {
                            color.setHSL(0, 1 - (normalizedTemp - 0.75) * 4, 0.8 + (normalizedTemp - 0.75) * 0.8); // แดง -> ขาว
                        }
                        
                        // ปรับสีและความเข้มแสง
                        object.material.emissive = color;
                        object.material.emissiveIntensity = 0.2 + normalizedTemp * 0.8;
                        object.material.needsUpdate = true;
                        
                        // ปรับแสงในฉาก
                        if (object.userData.glowMesh) {
                            object.userData.glowMesh.visible = parameters.temperature > 200;
                            if (object.userData.glowMesh.material.uniforms) {
                                object.userData.glowMesh.material.uniforms.glowColor.value = color;
                            }
                        }
                    }
                }
            });
        }
    }
    
    // เพิ่ม event listener สำหรับการควบคุม
    document.getElementById('temperature').addEventListener('input', function(e) {
        parameters.temperature = parseInt(e.target.value);
        updateParameters();
    });
    
    document.getElementById('pressure').addEventListener('input', function(e) {
        parameters.pressure = parseInt(e.target.value);
        updateParameters();
    });
    
    document.getElementById('flow-rate').addEventListener('input', function(e) {
        parameters.flowRate = parseInt(e.target.value);
        updateParameters();
    });
    
    document.getElementById('cooling-time').addEventListener('input', function(e) {
        parameters.coolingTime = parseInt(e.target.value);
        updateParameters();
    });
    
    // ปุ่มนำไปใช้
    document.getElementById('apply-params').addEventListener('click', function() {
        // ใช้ค่าที่ตั้งกับระบบจริง
        const activeModelType = currentModelType || 'valve-gate';
        
        // แสดงผลการทำงานตามพารามิเตอร์
        simulateWithParameters(activeModelType, parameters);
    });
    
    // ปุ่มรีเซ็ต
    document.getElementById('reset-params').addEventListener('click', function() {
        // คืนค่าเริ่มต้น
        parameters = { ...defaultParams };
        
        // อัปเดตสไลเดอร์และค่าที่แสดง
        document.getElementById('temperature').value = parameters.temperature;
        document.getElementById('pressure').value = parameters.pressure;
        document.getElementById('flow-rate').value = parameters.flowRate;
        document.getElementById('cooling-time').value = parameters.coolingTime;
        
        updateParameters();
    });
    
    // ปุ่มเปิด/ปิดแผงควบคุม
    toggleButton.addEventListener('click', function() {
        const panel = document.getElementById('parameters-panel');
        const isVisible = panel.style.display !== 'none';
        
        panel.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? 'แสดงพารามิเตอร์' : 'ซ่อนพารามิเตอร์';
    });
    
    // จำลองการทำงานด้วยพารามิเตอร์ที่กำหนด
    function simulateWithParameters(modelType, params) {
        // ลบชิ้นงานเก่าออกก่อน
        scene.traverse((object) => {
            if (object.name === "virtual_product" || object.name === "defective_product") {
                scene.remove(object);
            }
        });
        
        // เตรียมสำหรับการจำลอง
        stopAllAnimations();
        
        // เริ่มจำลองการทำงาน
        const timeline = gsap.timeline();
        
        // แสดงข้อความเริ่มการจำลอง
        const infoPanel = document.getElementById('part-info');
        if (infoPanel) {
            infoPanel.innerHTML = `
                <h4>กำลังจำลองการฉีดด้วยพารามิเตอร์ดังนี้:</h4>
                <ul>
                    <li>อุณหภูมิ: ${params.temperature}°C</li>
                    <li>แรงดัน: ${params.pressure} MPa</li>
                    <li>อัตราการไหล: ${params.flowRate} cm³/s</li>
                    <li>เวลาเย็นตัว: ${params.coolingTime} s</li>
                    <li>รอบเวลาทั้งหมด: ${params.cycleTime} s</li>
                </ul>
                <p>กำลังจำลองการทำงาน...</p>
            `;
        }
        
        // 1. เริ่มด้วยการให้ความร้อน
        timeline.call(() => {
            // เปลี่ยนสีฮีตเตอร์ตามอุณหภูมิ
            updateParameters();
        });
        
        // 2. แสดงแอนิเมชันการไหลของพลาสติก
        timeline.call(() => {
            // ปรับความเร็วตามอัตราการไหล
            SETTINGS.animationSpeed = params.flowRate / 50;
            
            // เริ่มการไหลของพลาสติก
            createRealisticPlasticFlow(modelType);
            
            // แสดงข้อความอัปเดต
            if (infoPanel) {
                infoPanel.innerHTML += `<p>กำลังฉีดพลาสติกด้วยความเร็ว ${params.flowRate} cm³/s...</p>`;
            }
        }, null, "+=1");
        
        // 3. รอเวลาในการฉีด
        const injectionTime = (params.flowRate < 30) ? 3 : (params.flowRate < 60) ? 2 : 1;
        
        timeline.call(() => {
            if (infoPanel) {
                infoPanel.innerHTML += `<p>รอเวลาเย็นตัว ${params.coolingTime} วินาที...</p>`;
            }
        }, null, "+=" + injectionTime);
        
        // 4. เย็นตัว (ปรับตามเวลาเย็นตัว)
        const actualCoolingTime = Math.min(params.coolingTime / 5, 4); // จำกัดเวลาในแอนิเมชันไม่ให้นานเกินไป
        
        timeline.call(() => {
            // หยุดการไหลของพลาสติก
            plasticParticles.forEach(particle => {
                if (particle.userData && particle.userData.animation) {
                    particle.userData.animation.pause();
                }
            });
            
            // เปลี่ยนสีพลาสติกเป็นโทนเย็นเพื่อแสดงการแข็งตัว
            plasticParticles.forEach(particle => {
                gsap.to(particle.material.color, {
                    r: 0.3,
                    g: 0.8,
                    b: 0.4,
                    duration: actualCoolingTime,
                    ease: "power1.in"
                });
            });
        }, null, "+=0.5");
        
        // 5. แสดงผลลัพธ์ชิ้นงาน
        timeline.call(() => {
            // ตรวจสอบคุณภาพชิ้นงานจากพารามิเตอร์
            checkProductQuality(modelType, params);
            
            if (infoPanel) {
                infoPanel.innerHTML += `<p>การจำลองเสร็จสิ้น กรุณาตรวจสอบคุณภาพชิ้นงาน</p>`;
            }
        }, null, "+=" + actualCoolingTime);
        
        return timeline;
    }
    
    // ตรวจสอบคุณภาพชิ้นงานจากพารามิเตอร์ที่ใช้
    function checkProductQuality(modelType, params) {
        // กำหนดค่าอุณหภูมิที่เหมาะสมสำหรับแต่ละระบบ
        const optimalParams = {
            'valve-gate': { 
                temperature: [220, 270],
                pressure: [100, 170],
                flowRate: [40, 70]
            },
            'thermal-gate': { 
                temperature: [230, 280],
                pressure: [110, 160],
                flowRate: [35, 65]
            },
            'open-tip': { 
                temperature: [210, 260],
                pressure: [90, 150],
                flowRate: [30, 60]
            }
        };
        
        const optimal = optimalParams[modelType];
        
        // ตรวจสอบว่าพารามิเตอร์อยู่ในช่วงที่เหมาะสมหรือไม่
        const tempOk = params.temperature >= optimal.temperature[0] && params.temperature <= optimal.temperature[1];
        const pressureOk = params.pressure >= optimal.pressure[0] && params.pressure <= optimal.pressure[1];
        const flowOk = params.flowRate >= optimal.flowRate[0] && params.flowRate <= optimal.flowRate[1];
        const coolingOk = params.coolingTime >= 12;
        
        // คำนวณคุณภาพโดยรวม
        let qualityIssues = [];
        let overallQuality = 100; // เริ่มที่ 100%
        
        if (!tempOk) {
            if (params.temperature < optimal.temperature[0]) {
                qualityIssues.push("อุณหภูมิต่ำเกินไป อาจทำให้เกิดการฉีดไม่เต็ม");
                overallQuality -= 20;
            } else {
                qualityIssues.push("อุณหภูมิสูงเกินไป อาจทำให้เกิดรอยไหม้");
                overallQuality -= 15;
            }
        }
        
        if (!pressureOk) {
            if (params.pressure < optimal.pressure[0]) {
                qualityIssues.push("แรงดันต่ำเกินไป อาจทำให้เกิดการฉีดไม่เต็มหรือรอยยุบ");
                overallQuality -= 20;
            } else {
                qualityIssues.push("แรงดันสูงเกินไป อาจทำให้เกิดครีบหรือเสียรูป");
                overallQuality -= 15;
            }
        }
        
        if (!flowOk) {
            if (params.flowRate < optimal.flowRate[0]) {
                qualityIssues.push("อัตราการไหลต่ำเกินไป อาจทำให้เกิดรอยเชื่อมหรือรอยด่าง");
                overallQuality -= 10;
            } else {
                qualityIssues.push("อัตราการไหลสูงเกินไป อาจทำให้เกิดฟองอากาศหรือการเสียรูป");
                overallQuality -= 10;
            }
        }
        
        if (!coolingOk) {
            qualityIssues.push("เวลาเย็นตัวไม่เพียงพอ อาจทำให้ชิ้นงานเสียรูปหลังการถอดออก");
            overallQuality -= 20;
        }
        
        // จำกัดคุณภาพต่ำสุดที่ 10%
        overallQuality = Math.max(overallQuality, 10);
        
        // สร้างชิ้นงานตามคุณภาพที่คำนวณได้
        createQualityBasedProduct(modelType, overallQuality, qualityIssues);
    }// สร้างชิ้นงานตามระดับคุณภาพที่คำนวณได้
    function createQualityBasedProduct(modelType, quality, issues) {
        // ลบชิ้นงานเก่าออกก่อน
        scene.traverse((object) => {
            if (object.name === "virtual_product" || object.name === "defective_product") {
                scene.remove(object);
            }
        });
        
        const productGroup = new THREE.Group();
        productGroup.name = "virtual_product";
        
        // เลือกรูปทรงตามประเภทของ Hot Runner
        let productGeometry;
        switch(modelType) {
            case 'valve-gate':
                productGeometry = new THREE.BoxGeometry(2, 0.2, 1);
                break;
            case 'thermal-gate':
                productGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
                break;
            case 'open-tip':
                productGeometry = new THREE.SphereGeometry(1, 32, 24);
                break;
            default:
                productGeometry = new THREE.BoxGeometry(2, 0.2, 1);
        }
        
        // สร้างวัสดุตามคุณภาพ
        // คุณภาพดี = สีเขียวสดใส, ผิวเรียบ
        // คุณภาพไม่ดี = สีเขียวหม่น, ผิวหยาบ
        const normalizedQuality = quality / 100;
        const productMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(
                0.2 + (1 - normalizedQuality) * 0.3, 
                0.7 * normalizedQuality, 
                0.2 * normalizedQuality
            ),
            metalness: 0.1,
            roughness: 0.2 + (1 - normalizedQuality) * 0.7,
            transparent: quality < 70,
            opacity: Math.min(1, 0.7 + (normalizedQuality * 0.3))
        });
        
        const product = new THREE.Mesh(productGeometry, productMaterial);
        product.position.set(0, 2, 0);
        product.castShadow = true;
        product.receiveShadow = true;
        
        // เพิ่มความไม่สมบูรณ์ตามระดับคุณภาพ
        if (quality < 90) {
            // คุณภาพต่ำกว่า 90% มีรอยบางอย่าง
            if (issues.some(issue => issue.includes("รอยเชื่อม") || issue.includes("รอยด่าง"))) {
                addWeldLines(product);
            }
        }
        
        if (quality < 70) {
            // คุณภาพต่ำกว่า 70% มีรอยยุบหรือไม่เต็ม
            if (issues.some(issue => issue.includes("รอยยุบ"))) {
                addSinkMarks(product);
            }
            
            if (issues.some(issue => issue.includes("ฉีดไม่เต็ม"))) {
                product.scale.set(0.9, 1, 0.9);
            }
        }
        
        if (quality < 50) {
            // คุณภาพต่ำกว่า 50% มีรอยไหม้หรือเสียรูป
            if (issues.some(issue => issue.includes("รอยไหม้"))) {
                addBurnMarks(product);
            }
            
            if (issues.some(issue => issue.includes("เสียรูป"))) {
                // ทำให้รูปทรงบิดเบี้ยวเล็กน้อย
                product.geometry.vertices.forEach(function(vertex) {
                    vertex.x += (Math.random() - 0.5) * 0.1;
                    vertex.y += (Math.random() - 0.5) * 0.1;
                    vertex.z += (Math.random() - 0.5) * 0.1;
                });
                product.geometry.verticesNeedUpdate = true;
            }
        }
        
        productGroup.add(product);
        scene.add(productGroup);
        
        // แสดงรายละเอียดคุณภาพและปัญหา
        const infoPanel = document.getElementById('part-info');
        if (infoPanel) {
            let qualityLevel = "";
            if (quality >= 90) qualityLevel = "ดีเยี่ยม";
            else if (quality >= 80) qualityLevel = "ดีมาก";
            else if (quality >= 70) qualityLevel = "ดี";
            else if (quality >= 60) qualityLevel = "พอใช้";
            else if (quality >= 40) qualityLevel = "ต่ำ";
            else qualityLevel = "แย่";
            
            let html = `
                <h4>ผลการจำลองการฉีดชิ้นงาน</h4>
                <p>คุณภาพโดยรวม: <span style="font-weight: bold; color: ${quality >= 70 ? 'green' : quality >= 50 ? 'orange' : 'red'}">${quality}% (${qualityLevel})</span></p>
            `;
            
            if (issues.length > 0) {
                html += `<p>ปัญหาที่พบ:</p><ul>`;
                issues.forEach(issue => {
                    html += `<li>${issue}</li>`;
                });
                html += `</ul>`;
                
                html += `<p>ข้อเสนอแนะในการปรับปรุง:</p><ul>`;
                if (issues.some(issue => issue.includes("อุณหภูมิต่ำ"))) {
                    html += `<li>เพิ่มอุณหภูมิขึ้นอีก 20-30°C</li>`;
                }
                if (issues.some(issue => issue.includes("อุณหภูมิสูง"))) {
                    html += `<li>ลดอุณหภูมิลง 20-30°C</li>`;
                }
                if (issues.some(issue => issue.includes("แรงดันต่ำ"))) {
                    html += `<li>เพิ่มแรงดันขึ้นอีก 20-30 MPa</li>`;
                }
                if (issues.some(issue => issue.includes("แรงดันสูง"))) {
                    html += `<li>ลดแรงดันลง 20-30 MPa</li>`;
                }
                if (issues.some(issue => issue.includes("อัตราการไหลต่ำ"))) {
                    html += `<li>เพิ่มอัตราการไหลขึ้นอีก 10-20 cm³/s</li>`;
                }
                if (issues.some(issue => issue.includes("อัตราการไหลสูง"))) {
                    html += `<li>ลดอัตราการไหลลง 10-20 cm³/s</li>`;
                }
                if (issues.some(issue => issue.includes("เวลาเย็นตัว"))) {
                    html += `<li>เพิ่มเวลาเย็นตัวอีกอย่างน้อย 5 วินาที</li>`;
                }
                html += `</ul>`;
            } else {
                html += `<p>ไม่พบปัญหาในการฉีด ชิ้นงานมีคุณภาพดี</p>`;
            }
            
            infoPanel.innerHTML = html;
        }
        
        // สร้างแอนิเมชันแสดงชิ้นงาน
        gsap.from(product.scale, {
            x: 0.01, y: 0.01, z: 0.01,
            duration: 1.5,
            ease: "elastic.out(1, 0.3)"
        });
        
        gsap.to(product.rotation, {
            y: Math.PI * 2,
            duration: 5,
            repeat: -1,
            ease: "none"
        });
        
        return productGroup;
    }
    
    // เพิ่มรอยเชื่อมบนชิ้นงาน
    function addWeldLines(product) {
        const isBox = product.geometry instanceof THREE.BoxGeometry;
        const isCylinder = product.geometry instanceof THREE.CylinderGeometry;
        const isSphere = product.geometry instanceof THREE.SphereGeometry;
        
        if (isBox) {
            // เพิ่มเส้นรอยเชื่อมบนกล่อง
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.8, 0.101, 0),
                new THREE.Vector3(0.8, 0.101, 0)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: new THREE.Color(
                    product.material.color.r * 0.8,
                    product.material.color.g * 0.8,
                    product.material.color.b * 0.8
                )
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            product.add(line);
        } else if (isCylinder) {
            // เพิ่มเส้นรอยเชื่อมบนทรงกระบอก
            const curve = new THREE.EllipseCurve(
                0, 0,               // center
                0.8, 0.8,           // xRadius, yRadius
                0, Math.PI * 2,     // startAngle, endAngle
                false,              // clockwise
                0                   // rotation
            );
            const points = curve.getPoints(50);
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: new THREE.Color(
                    product.material.color.r * 0.8,
                    product.material.color.g * 0.8,
                    product.material.color.b * 0.8
                )
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.position.y = 0.101;
            line.rotation.x = Math.PI / 2;
            product.add(line);
        } else if (isSphere) {
            // เพิ่มเส้นรอยเชื่อมบนทรงกลม
            const curve = new THREE.EllipseCurve(
                0, 0,               // center
                0.8, 0.8,           // xRadius, yRadius
                0, Math.PI * 2,     // startAngle, endAngle
                false,              // clockwise
                0                   // rotation
            );
            const points = curve.getPoints(50);
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: new THREE.Color(
                    product.material.color.r * 0.8,
                    product.material.color.g * 0.8,
                    product.material.color.b * 0.8
                )
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            product.add(line);
        }
    }
    
    // เพิ่มรอยยุบบนชิ้นงาน
    function addSinkMarks(product) {
        const sinkGeometry = new THREE.CircleGeometry(0.1, 16);
        const sinkMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
                product.material.color.r * 0.7,
                product.material.color.g * 0.7,
                product.material.color.b * 0.7
            ),
            side: THREE.DoubleSide
        });
        
        // เพิ่มรอยยุบหลายจุด
        for (let i = 0; i < 3; i++) {
            const sink = new THREE.Mesh(sinkGeometry, sinkMaterial);
            
            // ตำแหน่งแบบสุ่มตามรูปทรงของผลิตภัณฑ์
            let x, y, z;
            
            const isBox = product.geometry instanceof THREE.BoxGeometry;
            const isCylinder = product.geometry instanceof THREE.CylinderGeometry;
            const isSphere = product.geometry instanceof THREE.SphereGeometry;
            
            if (isBox) {
                x = Math.random() * 1.6 - 0.8;
                y = 0.101; // บนผิวบน
                z = Math.random() * 0.8 - 0.4;
                sink.rotation.x = -Math.PI / 2;
            } else if (isCylinder) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.8;
                x = Math.cos(angle) * radius;
                y = 0.101; // บนผิวบน
                z = Math.sin(angle) * radius;
                sink.rotation.x = -Math.PI / 2;
            } else if (isSphere) {
                // สุ่มจุดบนทรงกลม
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const radius = 1;
                x = Math.sin(theta) * Math.cos(phi) * radius;
                y = Math.sin(theta) * Math.sin(phi) * radius;
                z = Math.cos(theta) * radius;
                
                // ปรับการหมุนให้แนบกับผิว
                sink.position.set(x, y, z);
                sink.lookAt(0, 0, 0);
                product.add(sink);
                continue;
            }
            
            sink.position.set(x, y, z);
            product.add(sink);
        }
    }
    
    // เพิ่มรอยไหม้บนชิ้นงาน
    function addBurnMarks(product) {
        const burnGeometry = new THREE.CircleGeometry(0.15, 16);
        const burnMaterial = new THREE.MeshBasicMaterial({
            color: 0x220000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        // เพิ่มรอยไหม้หลายจุด
        for (let i = 0; i < 2; i++) {
            const burn = new THREE.Mesh(burnGeometry, burnMaterial);
            
            // ตำแหน่งแบบสุ่มตามรูปทรงของผลิตภัณฑ์
            let x, y, z;
            
            const isBox = product.geometry instanceof THREE.BoxGeometry;
            const isCylinder = product.geometry instanceof THREE.CylinderGeometry;
            const isSphere = product.geometry instanceof THREE.SphereGeometry;
            
            if (isBox) {
                x = Math.random() * 1.6 - 0.8;
                y = 0.101; // บนผิวบน
                z = Math.random() * 0.8 - 0.4;
                burn.rotation.x = -Math.PI / 2;
            } else if (isCylinder) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.8;
                x = Math.cos(angle) * radius;
                y = 0.101; // บนผิวบน
                z = Math.sin(angle) * radius;
                burn.rotation.x = -Math.PI / 2;
            } else if (isSphere) {
                // สุ่มจุดบนทรงกลม
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const radius = 1;
                x = Math.sin(theta) * Math.cos(phi) * radius;
                y = Math.sin(theta) * Math.sin(phi) * radius;
                z = Math.cos(theta) * radius;
                
                // ปรับการหมุนให้แนบกับผิว
                burn.position.set(x, y, z);
                burn.lookAt(0, 0, 0);
                product.add(burn);
                continue;
            }
            
            burn.position.set(x, y, z);
            product.add(burn);
        }
    }
    
    // เปิดเผยฟังก์ชันสำหรับใช้งาน
    return {
        showControlPanel: function() {
            document.getElementById('parameters-panel').style.display = 'block';
            document.getElementById('toggle-params').textContent = 'ซ่อนพารามิเตอร์';
        },
        hideControlPanel: function() {
            document.getElementById('parameters-panel').style.display = 'none';
            document.getElementById('toggle-params').textContent = 'แสดงพารามิเตอร์';
        },
        simulateWithParameters: simulateWithParameters,
        getParameters: () => parameters,
        setParameters: function(params) {
            parameters = { ...parameters, ...params };
            
            // อัปเดตสไลเดอร์
            document.getElementById('temperature').value = parameters.temperature;
            document.getElementById('pressure').value = parameters.pressure;
            document.getElementById('flow-rate').value = parameters.flowRate;
            document.getElementById('cooling-time').value = parameters.coolingTime;
            
            updateParameters();
        }
    };
}
    ///////////////////////////ขอบเขตการพัฒนา///////////
// ตั้งค่า controls

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.0;
    controls.screenSpacePanning = true;
}

// ตั้งค่าแสงสว่าง
function setupLights() {
    // แสงแวดล้อม
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // แสงทิศทาง
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = SETTINGS.shadows;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);
    
    // แสงสปอตไลท์
    spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(-5, 5, -5);
    spotLight.castShadow = SETTINGS.shadows;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);
    
    // เพิ่มตัวช่วยแสดงแสงถ้าอยู่ในโหมดดีบัก
    if (SETTINGS.showHelpers) {
        const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
        scene.add(directionalLightHelper);
        
        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        scene.add(spotLightHelper);
        
        const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
        scene.add(directionalLightCameraHelper);
    }
}

// ตั้งค่าวัสดุ
function setupMaterials() {
    // วัสดุพื้นฐาน
    materialLibrary.manifold = new THREE.MeshPhongMaterial({ 
        color: COLORS.manifold,
        specular: 0x111111,
        shininess: 30
    });
    
    materialLibrary.housing = new THREE.MeshPhongMaterial({ 
        color: COLORS.housing,
        specular: 0x222222,
        shininess: 30
    });
    
    materialLibrary.pin = new THREE.MeshStandardMaterial({
        color: COLORS.pin,
        metalness: 0.8,
        roughness: 0.2
    });
    
    materialLibrary.tipValve = new THREE.MeshPhongMaterial({ 
        color: COLORS.tipValve,
        specular: 0x555555,
        shininess: 40
    });
    
    materialLibrary.tipThermal = new THREE.MeshPhongMaterial({ 
        color: COLORS.tipThermal,
        specular: 0x555555,
        shininess: 40
    });
    
    materialLibrary.heater = new THREE.MeshStandardMaterial({
        color: COLORS.heaterValve,
        emissive: 0xff2200,
        emissiveIntensity: 0.2,
        metalness: 0.7,
        roughness: 0.3
    });
    
    materialLibrary.pipe = new THREE.MeshStandardMaterial({
        color: COLORS.pipe,
        metalness: 0.6,
        roughness: 0.4
    });
    
    materialLibrary.sprue = new THREE.MeshStandardMaterial({
        color: COLORS.sprue,
        metalness: 0.6,
        roughness: 0.4
    });
    
    materialLibrary.plastic = new THREE.MeshStandardMaterial({
        color: COLORS.plastic,
        transparent: true,
        opacity: 0.8,
        metalness: 0.0,
        roughness: 0.2
    });
    
    materialLibrary.highlight = new THREE.MeshBasicMaterial({
        color: COLORS.highlight,
        transparent: true,
        opacity: 0.5,
        wireframe: false
    });
    
    materialLibrary.selected = new THREE.MeshBasicMaterial({
        color: COLORS.selected,
        transparent: true,
        opacity: 0.5,
        wireframe: false
    });
    
    // สร้างวัสดุสำหรับโหมดแสดงไวร์เฟรม
    for (const key in materialLibrary) {
        if (key !== 'highlight' && key !== 'selected') {
            materialLibrary[key + 'Wireframe'] = materialLibrary[key].clone();
            materialLibrary[key + 'Wireframe'].wireframe = true;
        }
    }
}

// โหลดเท็กซ์เจอร์
async function loadTextures() {
    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader(loadingManager);
        
        // เท็กซ์เจอร์พื้น
        textureLoader.load('textures/floor_diffuse.jpg', function(texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
            textureLibrary.floorDiffuse = texture;
            
            // โหลดเท็กซ์เจอร์ normal map
            textureLoader.load('textures/floor_normal.jpg', function(normalMap) {
                normalMap.wrapS = THREE.RepeatWrapping;
                normalMap.wrapT = THREE.RepeatWrapping;
                normalMap.repeat.set(10, 10);
                textureLibrary.floorNormal = normalMap;
                
                // โหลดเท็กซ์เจอร์ roughness map
                textureLoader.load('textures/floor_roughness.jpg', function(roughnessMap) {
                    roughnessMap.wrapS = THREE.RepeatWrapping;
                    roughnessMap.wrapT = THREE.RepeatWrapping;
                    roughnessMap.repeat.set(10, 10);
                    textureLibrary.floorRoughness = roughnessMap;
                    
                    resolve();
                }, undefined, function() {
                    // หากไม่สามารถโหลดได้ก็ทำงานต่อ
                    resolve();
                });
            }, undefined, function() {
                // หากไม่สามารถโหลดได้ก็ทำงานต่อ
                resolve();
            });
        }, undefined, function() {
            // หากไม่สามารถโหลดได้ก็ทำงานต่อ
            resolve();
        });
    });
}

// ตั้งค่า post-processing effects
function setupEffects() {
    if (!SETTINGS.antialiasing) return;
    
    // ตรวจสอบว่ามี post-processing modules หรือไม่
    if (!THREE.EffectComposer) {
        console.warn('EffectComposer not found. Post-processing effects disabled.');
        return;
    }
    
    try {
        // สร้าง effect composer
        effectComposer = new THREE.EffectComposer(renderer);
        
        // เพิ่ม render pass
        const renderPass = new THREE.RenderPass(scene, camera);
        effectComposer.addPass(renderPass);
        
        // เพิ่ม outline pass ถ้ามี
        if (THREE.OutlinePass) {
            outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
            outlinePass.edgeStrength = 3.0;
            outlinePass.edgeGlow = 0.5;
            outlinePass.edgeThickness = 1.0;
            outlinePass.pulsePeriod = 0;
            outlinePass.visibleEdgeColor.set(0xffff00);
            outlinePass.hiddenEdgeColor.set(0x333333);
            effectComposer.addPass(outlinePass);
        }
        
        // เพิ่ม FXAA pass ถ้ามี
        if (THREE.FXAAShader) {
            const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
            effectComposer.addPass(fxaaPass);
        }
    } catch (error) {
        console.error('Error setting up post-processing effects:', error);
    }
}
// ตั้งค่า GUI สำหรับการปรับแต่ง
function setupGUI() {
    gui = new dat.GUI();
    
    // โฟลเดอร์การแสดงผล
    const renderFolder = gui.addFolder('Rendering');
    renderFolder.add(SETTINGS, 'shadows').name('Shadows').onChange(value => {
        directionalLight.castShadow = value;
        spotLight.castShadow = value;
        renderer.shadowMap.enabled = value;
    });
    renderFolder.add(SETTINGS, 'reflections').name('Reflections');
    renderFolder.add(SETTINGS, 'antialiasing').name('Anti-aliasing').onChange(value => {
        // จำเป็นต้องรีสตาร์ททั้งหมดเพื่อเปลี่ยน anti-aliasing
        alert('Requires restart to apply change');
    });
    renderFolder.open();
    
    // โฟลเดอร์กล้อง
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(controls, 'autoRotate').name('Auto Rotate');
    cameraFolder.add(controls, 'autoRotateSpeed', 0.1, 5).name('Rotation Speed');
    cameraFolder.add({resetCamera: () => resetCamera()}, 'resetCamera').name('Reset Camera');
    cameraFolder.open();
    
    // โฟลเดอร์การแสดงผลโมเดล
    const modelFolder = gui.addFolder('Model Display');
    modelFolder.add(SETTINGS, 'showWireframe').name('Wireframe').onChange(toggleWireframe);
    modelFolder.add(SETTINGS, 'showBoundingBox').name('Bounding Box').onChange(toggleBoundingBox);
    modelFolder.add(SETTINGS, 'showHelpers').name('Show Helpers').onChange(toggleHelpers);
    modelFolder.add(SETTINGS, 'highlightParts').name('Highlight Parts');
    modelFolder.open();
    
    // โฟลเดอร์แอนิเมชัน
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(SETTINGS, 'animationSpeed', 0.1, 3).name('Animation Speed');
    animationFolder.add(SETTINGS, 'particleCount', 1, 300, 1).name('Particle Count');
    animationFolder.add({playValveAnimation: () => animateValveGate()}, 'playValveAnimation').name('Valve Animation');
    animationFolder.add({playFlowAnimation: () => {
        // หยุดแอนิเมชันที่ทำงานอยู่
        stopAllAnimations();
        
        // เลือกประเภทโมเดลที่กำลังแสดงอยู่
        let activeModelType = 'valve-gate';
        if (thermalGateModel && thermalGateModel.visible) {
            activeModelType = 'thermal-gate';
        } else if (openTipModel && openTipModel.visible) {
            activeModelType = 'open-tip';
        }
        
        // เริ่มแอนิเมชันการไหล
        animatePlasticFlow(activeModelType);
    }}, 'playFlowAnimation').name('Flow Animation');
    animationFolder.add({stopAnimations: () => stopAllAnimations()}, 'stopAnimations').name('Stop Animations');
    animationFolder.open();
    
    // โฟลเดอร์การจัดการโมเดล
    const explodeFolder = gui.addFolder('Model Manipulation');
    explodeFolder.add({explode: () => {
        isExploded = !isExploded;
        createExplodedView(currentModel, isExploded);
    }}, 'explode').name('Toggle Exploded View');
    explodeFolder.add({resetModel: () => resetModelPosition()}, 'resetModel').name('Reset Model');
    explodeFolder.open();
}

// ตั้งค่าการแสดงผลสถิติ
function setupStats(container) {
    stats = new Stats();
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.right = '0px';
    stats.dom.style.left = 'auto';
    container.appendChild(stats.dom);
}

// สร้างสภาพแวดล้อม
function createEnvironment() {
    // สร้างพื้น
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.0
    });
    
    // เพิ่มเท็กซ์เจอร์ถ้ามี
    if (textureLibrary.floorDiffuse) {
        floorMaterial.map = textureLibrary.floorDiffuse;
    }
    if (textureLibrary.floorNormal) {
        floorMaterial.normalMap = textureLibrary.floorNormal;
    }
    if (textureLibrary.floorRoughness) {
        floorMaterial.roughnessMap = textureLibrary.floorRoughness;
    }
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // สร้างกริด
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
    gridHelper.position.y = -1.999;
    scene.add(gridHelper);
    
    // สร้างแสงแวดล้อม
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    const lightSphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    lightSphere1.position.copy(directionalLight.position);
    lightSphere1.scale.set(0.1, 0.1, 0.1);
    lightSphere1.visible = SETTINGS.showHelpers;
    scene.add(lightSphere1);
    
    const lightSphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    lightSphere2.position.copy(spotLight.position);
    lightSphere2.scale.set(0.1, 0.1, 0.1);
    lightSphere2.visible = SETTINGS.showHelpers;
    scene.add(lightSphere2);
}

// สร้างโมเดล 3D
function createModels() {
    // ----- Valve Gate Model -----
    valveGateModel = new THREE.Group();
    
    // Manifold (base)
    const manifoldGeometry = new THREE.BoxGeometry(4, 0.5, 2);
    const manifoldMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3366cc,
        specular: 0x111111,
        shininess: 30
    });
    const manifold = new THREE.Mesh(manifoldGeometry, manifoldMaterial);
    manifold.position.y = -1;
    manifold.castShadow = true;
    manifold.receiveShadow = true;
    manifold.name = 'manifold';
    valveGateModel.add(manifold);
    
    // Hot tips
    for (let i = -1; i <= 1; i += 2) {
        // Cylinder for the hot tip housing
        const housingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16);
        const housingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x777777,
            specular: 0x222222,
            shininess: 30
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(i, -0.25, 0);
        housing.castShadow = true;
        housing.receiveShadow = true;
        housing.name = `housing_${i}`;
        valveGateModel.add(housing);
        
        // Smaller cylinder for the valve pin
        const pinGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16);
        const pinMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            specular: 0x444444,
            shininess: 50
        });
        const pin = new THREE.Mesh(pinGeometry, pinMaterial);
        pin.position.set(i, 0, 0);
        pin.castShadow = true;
        pin.name = `valve_pin_${i}`;
        valveGateModel.add(pin);
        
        // Tip at the end
        const tipGeometry = new THREE.ConeGeometry(0.2, 0.3, 16);
        const tipMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xdd3333,
            specular: 0x555555,
            shininess: 40
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.set(i, 0.65, 0);
        tip.castShadow = true;
        tip.name = `tip_${i}`;
        valveGateModel.add(tip);
        
        // Heaters (represented as rings)
        const heaterGeometry = new THREE.TorusGeometry(0.4, 0.05, 16, 32);
        const heaterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            specular: 0x333333,
            shininess: 30
        });
        const heater = new THREE.Mesh(heaterGeometry, heaterMaterial);
        heater.position.set(i, -0.5, 0);
        heater.rotation.x = Math.PI / 2;
        heater.castShadow = true;
        heater.name = `heater_${i}`;
        valveGateModel.add(heater);
    }
    
    // Piping for plastic flow
    const pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 16);
    const pipeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x666666,
        specular: 0x222222,
        shininess: 30
    });
    const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.y = -1;
    pipe.rotation.z = Math.PI / 2;
    pipe.castShadow = true;
    pipe.name = 'pipe';
    valveGateModel.add(pipe);
    
    // Sprue bushing at the top
    const sprueGeometry = new THREE.CylinderGeometry(0.4, 0.2, 0.5, 16);
    const sprueMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,
        specular: 0x222222,
        shininess: 30
    });
    const sprue = new THREE.Mesh(sprueGeometry, sprueMaterial);
    sprue.position.set(0, -1, 0);
    sprue.rotation.x = Math.PI / 2;
    sprue.castShadow = true;
    sprue.name = 'sprue';
    valveGateModel.add(sprue);
    
    // Add labels to important parts
    addLabel('Manifold', 0, -1.3, 0);
    addLabel('Valve Pin', -1, 0.3, 0.5);
    addLabel('Hot Tip', 1, 0.8, 0.5);
    addLabel('Heater', -1, -0.8, 0.5);
    addLabel('Sprue', 0, -1, 0.5);
    
    scene.add(valveGateModel);
    valveGateModel.visible = false;
    
    // ----- Thermal Gate Model -----
    thermalGateModel = new THREE.Group();
    
    // Clone manifold from valve gate
    const thermalManifold = manifold.clone();
    thermalManifold.name = 'thermal_manifold';
    thermalGateModel.add(thermalManifold);
    
    // Hot tips without pins
    for (let i = -1; i <= 1; i += 2) {
        const thermalHousingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16);
        const thermalHousingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x777777,
            specular: 0x222222,
            shininess: 30
        });
        const thermalHousing = new THREE.Mesh(thermalHousingGeometry, thermalHousingMaterial);
        thermalHousing.position.set(i, -0.25, 0);
        thermalHousing.castShadow = true;
        thermalHousing.receiveShadow = true;
        thermalHousing.name = `thermal_housing_${i}`;
        thermalGateModel.add(thermalHousing);
        
        // Different tip design
        const thermalTipGeometry = new THREE.ConeGeometry(0.3, 0.4, 16);
        const thermalTipMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xee9900,
            specular: 0x555555,
            shininess: 40
        });
        const thermalTip = new THREE.Mesh(thermalTipGeometry, thermalTipMaterial);
        thermalTip.position.set(i, 0.45, 0);
        thermalTip.castShadow = true;
        thermalTip.name = `thermal_tip_${i}`;
        thermalGateModel.add(thermalTip);
        
        // Multiple heating rings
        for (let j = -0.6; j <= 0; j += 0.3) {
            const thermalHeaterGeometry = new THREE.TorusGeometry(0.4, 0.05, 16, 32);
            const thermalHeaterMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xff3300,
                specular: 0x333333,
                shininess: 30
            });
            const thermalHeater = new THREE.Mesh(thermalHeaterGeometry, thermalHeaterMaterial);
            thermalHeater.position.set(i, j, 0);
            thermalHeater.rotation.x = Math.PI / 2;
            thermalHeater.castShadow = true;
            thermalHeater.name = `thermal_heater_${i}_${j}`;
            thermalGateModel.add(thermalHeater);
        }
    }
    
    // Clone pipe
    const thermalPipe = pipe.clone();
    thermalPipe.name = 'thermal_pipe';
    thermalGateModel.add(thermalPipe);
    
    // Clone sprue
    const thermalSprue = sprue.clone();
    thermalSprue.name = 'thermal_sprue';
    thermalGateModel.add(thermalSprue);
    
    scene.add(thermalGateModel);
    thermalGateModel.visible = false;
    
    // ----- Open Tip Model -----
    openTipModel = new THREE.Group();
    
    // Clone manifold from valve gate
    const openManifold = manifold.clone();
    openManifold.name = 'open_manifold';
    openTipModel.add(openManifold);
    
    // Open tips
    for (let i = -1; i <= 1; i += 2) {
        const openHousingGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
        const openHousingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x777777,
            specular: 0x222222,
            shininess: 30
        });
        const openHousing = new THREE.Mesh(openHousingGeometry, openHousingMaterial);
        openHousing.position.set(i, -0.35, 0);
        openHousing.castShadow = true;
        openHousing.receiveShadow = true;
        openHousing.name = `open_housing_${i}`;
        openTipModel.add(openHousing);
        
        // Open tip shows actual hole
        const holeGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 16);
        const holeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            specular: 0x111111,
            shininess: 30
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.set(i, 0.05, 0);
        hole.name = `open_hole_${i}`;
        openTipModel.add(hole);
        
        // Simple heater band
        const openHeaterGeometry = new THREE.TorusGeometry(0.4, 0.08, 16, 32);
        const openHeaterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff4400,
            specular: 0x333333,
            shininess: 30
        });
        const openHeater = new THREE.Mesh(openHeaterGeometry, openHeaterMaterial);
        openHeater.position.set(i, -0.5, 0);
        openHeater.rotation.x = Math.PI / 2;
        openHeater.castShadow = true;
        openHeater.name = `open_heater_${i}`;
        openTipModel.add(openHeater);
    }
    
    // Clone pipe
    const openPipe = pipe.clone();
    openPipe.name = 'open_pipe';
    openTipModel.add(openPipe);
    
    // Clone sprue
    const openSprue = sprue.clone();
    openSprue.name = 'open_sprue';
    openTipModel.add(openSprue);
    
    scene.add(openTipModel);
    openTipModel.visible = false;
}

// เพิ่มป้ายชื่อให้กับส่วนประกอบต่างๆ
function addLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // วาดพื้นหลังที่โปร่งใส
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // วาดข้อความ
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // สร้าง texture จาก canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // สร้าง sprite จาก texture
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1, 0.5, 1);
    sprite.position.set(x, y, z);
    sprite.name = `label_${text}`;
    sprite.visible = false; // ซ่อนป้ายชื่อก่อน
    
    // เพิ่ม sprite เข้าไปในโมเดล
    if (valveGateModel) valveGateModel.add(sprite);
}

// แสดงหรือซ่อนป้ายชื่อ
function toggleLabels(show = true) {
    if (!valveGateModel) return;
    
    valveGateModel.traverse((object) => {
        if (object.name && object.name.startsWith('label_')) {
            object.visible = show;
        }
    });
    
    thermalGateModel.traverse((object) => {
        if (object.name && object.name.startsWith('label_')) {
            object.visible = show;
        }
    });
    
    openTipModel.traverse((object) => {
        if (object.name && object.name.startsWith('label_')) {
            object.visible = show;
        }
    });
}

// แสดงโมเดลตามที่เลือก
// แก้ไขฟังก์ชัน showModel ที่มีอยู่
function showModel(modelType) {
    // Hide all models first
    valveGateModel.visible = false;
    thermalGateModel.visible = false;
    openTipModel.visible = false;
    
    // บันทึกประเภทโมเดลปัจจุบัน
    currentModelType = modelType;
    
    // Show selected model
    switch(modelType) {
        case 'valve-gate':
            valveGateModel.visible = true;
            currentModel = valveGateModel;
            break;
        case 'thermal-gate':
            thermalGateModel.visible = true;
            currentModel = thermalGateModel;
            break;
        case 'open-tip':
            openTipModel.visible = true;
            currentModel = openTipModel;
            break;  console.log('Three.js initialized successfully');
    }
    
    // Reset camera view
    camera.position.set(0, 0, 5);
    if (controls && controls.reset) {
        controls.reset();
    }
}
// สร้าง animation แสดงการทำงานของ Valve Gate
function animateValveGate() {
    // หยุดแอนิเมชันทั้งหมด
    stopAllAnimations();
    
    if (!valveGateModel) return;
    
    // ถ้าโมเดลไม่แสดงอยู่ให้แสดงก่อน
    if (!valveGateModel.visible) {
        showModel('valve-gate');
    }
    
    // ค้นหา valve pins
    const pins = [];
    valveGateModel.traverse((object) => {
        if (object.name && object.name.startsWith('valve_pin_')) {
            pins.push(object);
        }
    });
    
    // ทำ animation เลื่อนเข็มขึ้น-ลง
    pins.forEach((pin) => {
        const startY = pin.position.y;
        
        // ใช้ GSAP สำหรับ animation
        const timeline = gsap.timeline({ 
            repeat: -1, 
            yoyo: true,
            onUpdate: function() {
                // อัปเดตเมื่อมีการเคลื่อนไหว
                pin.userData.currentY = pin.position.y;
            }
        });
        
        timeline.to(pin.position, { 
            y: startY - 0.5, 
            duration: 2 / SETTINGS.animationSpeed, 
            ease: "power2.inOut"
        });
        
        // เก็บ timeline ไว้ในอ็อบเจกต์เพื่อให้สามารถหยุดได้
        pin.userData.animation = timeline;
    });
    
    return pins;
}
// สร้าง animation แสดงการไหลของพลาสติก
function animatePlasticFlow(modelType) {
    // หยุดแอนิเมชันทั้งหมด
    stopAllAnimations();
    
    const model = modelType === 'valve-gate' ? valveGateModel :
                modelType === 'thermal-gate' ? thermalGateModel : 
                openTipModel;
    
    if (!model || !model.visible) {
        // ถ้าโมเดลไม่แสดงอยู่ให้แสดงก่อน
        showModel(modelType);
    }
    
    // ลบอนุภาคเก่าออก
    plasticParticles.forEach(particle => {
        if (particle.parent) {
            particle.parent.remove(particle);
        }
    });
    plasticParticles = [];
    
    // กำหนดเส้นทางการไหลตามชนิดของ Hot Runner
    let paths = [];
    
    if (modelType === 'valve-gate') {
        paths = [
            // เส้นทางซ้าย
            [
                new THREE.Vector3(0, -1, 0), // จุดเริ่มต้นที่ sprue
                new THREE.Vector3(-2, -1, 0), // ไหลไปทางซ้าย
                new THREE.Vector3(-1, -0.5, 0), // ขึ้นไปที่ hot tip ซ้าย
                new THREE.Vector3(-1, 0.65, 0) // ออกที่ปลาย tip ซ้าย
            ],
            // เส้นทางขวา
            [
                new THREE.Vector3(0, -1, 0), // จุดเริ่มต้นที่ sprue
                new THREE.Vector3(2, -1, 0), // ไหลไปทางขวา
                new THREE.Vector3(1, -0.5, 0), // ขึ้นไปที่ hot tip ขวา
                new THREE.Vector3(1, 0.65, 0) // ออกที่ปลาย tip ขวา
            ]
        ];
    } else if (modelType === 'thermal-gate') {
        paths = [
            // เส้นทางซ้าย
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(-2, -1, 0),
                new THREE.Vector3(-1, -0.5, 0),
                new THREE.Vector3(-1, 0.45, 0)
            ],
            // เส้นทางขวา
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(2, -1, 0),
                new THREE.Vector3(1, -0.5, 0),
                new THREE.Vector3(1, 0.45, 0)
            ]
        ];
    } else {
        paths = [
            // เส้นทางซ้าย
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(-2, -1, 0),
                new THREE.Vector3(-1, -0.5, 0),
                new THREE.Vector3(-1, 0.05, 0)
            ],
            // เส้นทางขวา
            [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(2, -1, 0),
                new THREE.Vector3(1, -0.5, 0),
                new THREE.Vector3(1, 0.05, 0)
            ]
        ];
    }
    
    // สร้างและทำแอนิเมชันอนุภาคหลายๆ ชิ้น
    const particleCount = SETTINGS.particleCount;
    const particlesPerPath = particleCount / paths.length;
    
    paths.forEach((path, pathIndex) => {
        for (let i = 0; i < particlesPerPath; i++) {
            // สร้างลูกบอลพลาสติกขนาดเล็ก
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: COLORS.plastic,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // กำหนดตำแหน่งเริ่มต้นแบบสุ่มบนเส้นทาง
            const startDelay = Math.random() * 2; // หน่วงเวลาเริ่มต้นแบบสุ่ม
            particle.position.copy(path[0]);
            model.add(particle);
            
            // เก็บอนุภาคในอาร์เรย์
            plasticParticles.push(particle);
            
            // ใช้ GSAP ทำแอนิเมชันเคลื่อนที่ตามเส้นทาง
            const timeline = gsap.timeline({ 
                repeat: -1,
                delay: startDelay,
                onComplete: function() {
                    // เมื่อจบเส้นทางแล้วอาจจะทำอะไรต่อก็ได้
                }
            });
            
            // เพิ่มการเคลื่อนที่แต่ละช่วง
            for (let j = 1; j < path.length; j++) {
                timeline.to(particle.position, {
                    x: path[j].x,
                    y: path[j].y,
                    z: path[j].z,
                    duration: 1 / SETTINGS.animationSpeed,
                    ease: "none"
                });
            }
            
            // เก็บ timeline ไว้ในอ็อบเจกต์เพื่อให้สามารถหยุดได้
            particle.userData.animation = timeline;
        }
    });
    
    return plasticParticles;
}

// หยุดแอนิเมชันทั้งหมด
function stopAllAnimations() {
    // หยุดแอนิเมชันเข็มควบคุม
    if (valveGateModel) {
        valveGateModel.traverse((object) => {
            if (object.userData && object.userData.animation) {
                object.userData.animation.kill();
                delete object.userData.animation;
                
                // คืนค่าตำแหน่งเดิม
                if (object.userData.originalPosition) {
                    object.position.copy(object.userData.originalPosition);
                }
            }
        });
    }
    
    // หยุดแอนิเมชันอนุภาคพลาสติก
    plasticParticles.forEach(particle => {
        if (particle.userData && particle.userData.animation) {
            particle.userData.animation.kill();
            delete particle.userData.animation;
        }
        
        // ลบอนุภาคออกจากฉาก
        if (particle.parent) {
            particle.parent.remove(particle);
        }
    });
    
    // ล้างอาร์เรย์อนุภาค
    plasticParticles = [];
}

// สร้าง exploded view (แยกชิ้นส่วน)
function createExplodedView(model, exploded = true) {
    if (!model) return;
    
    const timeline = gsap.timeline();
    
    // หาชิ้นส่วนที่แยกได้
    const parts = [];
    model.traverse((object) => {
        if (object.isMesh && !object.name.startsWith('label_')) {
            parts.push(object);
        }
    });
    
    if (exploded) {
        // แยกชิ้นส่วนออกจากกัน
        parts.forEach((part) => {
            // กำหนดทิศทางการแยกชิ้นส่วน
            const direction = new THREE.Vector3();
            
            // คำนวณทิศทางจากจุดศูนย์กลางของโมเดล
            direction.subVectors(part.position, new THREE.Vector3(0, -1, 0)).normalize();
            
            // ถ้าทิศทางมีค่าใกล้ศูนย์มากไป ให้กำหนดเป็นแกน Y
            if (direction.length() < 0.1) {
                direction.set(0, 1, 0);
            }
            
            // กำหนดระยะทางตามขนาดชิ้นส่วน
            const distance = 0.5 + Math.random() * 0.5;
            
            // บันทึกตำแหน่งเดิมถ้ายังไม่มีการบันทึก
            if (!part.userData.originalPosition) {
                part.userData.originalPosition = part.position.clone();
            }
            
            // แอนิเมชันเคลื่อนย้ายชิ้นส่วน
            timeline.to(part.position, {
                x: part.position.x + direction.x * distance,
                y: part.position.y + direction.y * distance,
                z: part.position.z + direction.z * distance,
                duration: 1,
                ease: "power2.out"
            }, 0);
        });
    } else {
        // รวมชิ้นส่วนเข้าด้วยกัน
        parts.forEach((part) => {
            const originalPosition = part.userData.originalPosition;
            if (originalPosition) {
                timeline.to(part.position, {
                    x: originalPosition.x,
                    y: originalPosition.y,
                    z: originalPosition.z,
                    duration: 1,
                    ease: "power2.out"
                }, 0);
            }
        });
    }
    
    isExploded = exploded;
    return timeline;
}
// ตั้งค่า Raycaster สำหรับการตรวจจับการชี้เมาส์
function setupRaycaster(container) {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // กำหนดค่าเริ่มต้นสำหรับเมาส์
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onMouseClick);
}

// ตั้งค่าตำแหน่งกล้องสำหรับมุมมองต่างๆ
function setupCameraPositions() {
    cameraPositions = {
        front: new THREE.Vector3(0, 0, 5),
        top: new THREE.Vector3(0, 5, 0),
        side: new THREE.Vector3(5, 0, 0),
        isometric: new THREE.Vector3(3, 3, 3)
    };
}
// คืนค่ากล้องไปยังตำแหน่งเริ่มต้น
function resetCamera() {
    camera.position.copy(cameraPositions.front);
    controls.target.set(0, 0, 0);
    controls.update();
}
// คืนค่าตำแหน่งโมเดลไปยังตำแหน่งเริ่มต้น
function resetModelPosition() {
    if (!currentModel) return;
    
    isExploded = false;
    createExplodedView(currentModel, false);
    
    currentModel.position.set(0, 0, 0);
    currentModel.rotation.set(0, 0, 0);
    currentModel.scale.set(1, 1, 1);
}


// กำหนดมุมมองกล้อง
function setCameraView(viewName) {
    if (!cameraPositions[viewName]) return;
    
    gsap.to(camera.position, {
        x: cameraPositions[viewName].x,
        y: cameraPositions[viewName].y,
        z: cameraPositions[viewName].z,
        duration: 1,
        ease: "power2.out",
        onUpdate: function() {
            camera.lookAt(0, 0, 0);
        },
        onComplete: function() {
            controls.target.set(0, 0, 0);
            controls.update();
        }
    });
}


// เปิด/ปิดการแสดงโมเดลแบบ wireframe
function toggleWireframe(show = true) {
    if (!currentModel) return;
    
    currentModel.traverse((object) => {
        if (object.isMesh) {
            const materialName = object.material.name || 'default';
            
            if (show) {
                // เปลี่ยนเป็นวัสดุ wireframe
                if (materialLibrary[materialName + 'Wireframe']) {
                    object.material = materialLibrary[materialName + 'Wireframe'];
                } else {
                    object.material.wireframe = true;
                }
            } else {
                // เปลี่ยนกลับเป็นวัสดุปกติ
                if (materialLibrary[materialName]) {
                    object.material = materialLibrary[materialName];
                } else {
                    object.material.wireframe = false;
                }
            }
        }
    });
}

// เปิด/ปิดการแสดง bounding box ของโมเดล
function toggleBoundingBox(show = true) {
    if (!currentModel) return;
    
    // ลบ bounding box เก่าออก
    currentModel.traverse((object) => {
        if (object.userData && object.userData.boundingBoxHelper) {
            if (object.userData.boundingBoxHelper.parent) {
                object.userData.boundingBoxHelper.parent.remove(object.userData.boundingBoxHelper);
            }
            delete object.userData.boundingBoxHelper;
        }
    });
    
    if (show) {
        // เพิ่ม bounding box ใหม่
        currentModel.traverse((object) => {
            if (object.isMesh) {
                const box = new THREE.Box3().setFromObject(object);
                const boxHelper = new THREE.Box3Helper(box, 0xffff00);
                scene.add(boxHelper);
                
                // เก็บ reference ไว้เพื่อลบออกได้ง่าย
                if (!object.userData) object.userData = {};
                object.userData.boundingBoxHelper = boxHelper;
            }
        });
    }
}
// เปิด/ปิดการแสดงตัวช่วยต่างๆ
function toggleHelpers(show = true) {
    if (!scene) return;
    
    // ค้นหาตัวช่วยในฉาก
    scene.traverse((object) => {
        if (object.isGridHelper || object.isAxesHelper || 
            object.isDirectionalLightHelper || object.isSpotLightHelper ||
            object.isCameraHelper) {
            object.visible = show;
        }
    });
    
    // ถ้าเปิดใช้งานและยังไม่มีตัวช่วย ให้สร้างใหม่
    if (show && directionalLight && !directionalLight.userData.helper) {
        const dlHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
        scene.add(dlHelper);
        directionalLight.userData.helper = dlHelper;
        
        if (directionalLight.shadow && directionalLight.shadow.camera) {
            const dlCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
            scene.add(dlCameraHelper);
            directionalLight.userData.cameraHelper = dlCameraHelper;
        }
    }
    
    if (show && spotLight && !spotLight.userData.helper) {
        const slHelper = new THREE.SpotLightHelper(spotLight);
        scene.add(slHelper);
        spotLight.userData.helper = slHelper;
    }
}

// จัดการเหตุการณ์การเคลื่อนที่ของเมาส์
function onMouseMove(event) {
    if (!currentModel || !raycaster || !mouse) return;
    
    // คำนวณตำแหน่งเมาส์เทียบกับ container
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    
    // ตั้งค่า raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // ค้นหา intersections
    const intersects = raycaster.intersectObjects(currentModel.children, true);
    
    // รีเซ็ตชิ้นส่วนที่เคยชี้
    if (hoveredPart && hoveredPart.material && hoveredPart.userData.originalMaterial) {
        hoveredPart.material = hoveredPart.userData.originalMaterial;
        hoveredPart = null;
    }
    
    if (outlinePass) {
        outlinePass.selectedObjects = [];
    }
    
    // ถ้าชี้ที่ชิ้นส่วนและการไฮไลต์เปิดอยู่
    if (intersects.length > 0 && SETTINGS.highlightParts) {
        hoveredPart = intersects[0].object;
        
        // เก็บวัสดุเดิม
        if (!hoveredPart.userData) hoveredPart.userData = {};
        hoveredPart.userData.originalMaterial = hoveredPart.material;
        
        // ไฮไลต์ชิ้นส่วน
        if (outlinePass) {
            outlinePass.selectedObjects = [hoveredPart];
        } else {
            hoveredPart.material = materialLibrary.highlight || 
                new THREE.MeshBasicMaterial({ 
                    color: COLORS.highlight,
                    transparent: true,
                    opacity: 0.5
                });
        }
        
        // แสดงป้ายชื่อถ้ามี
        if (SETTINGS.showLabels) {
            currentModel.traverse((object) => {
                if (object.name && object.name.startsWith('label_')) {
                    const partName = hoveredPart.name.split('_')[0];
                    if (object.name.includes(partName)) {
                        object.visible = true;
                    }
                }
            });
        }
        
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
}

// จัดการเหตุการณ์การคลิกเมาส์
function onMouseClick(event) {
    if (!hoveredPart || !currentModel) return;
    
    // เพิ่มการทำงานเมื่อคลิกที่ชิ้นส่วน
    console.log(`Clicked on ${hoveredPart.name}`);
    
    // ถ้ามีหน้าต่างข้อมูล ให้แสดงข้อมูลของชิ้นส่วน
    showPartInfo(hoveredPart);
}

// แสดงข้อมูลของชิ้นส่วน
function showPartInfo(part) {
    if (!part) return;
    
    // ในที่นี้อาจจะแสดงข้อมูลใน DOM หรือส่งข้อมูลไปยัง event handler ภายนอก
    const partName = part.name.split('_')[0];
    const event = new CustomEvent('partSelected', { 
        detail: { 
            name: partName,
            object: part
        }
    });
    
    window.dispatchEvent(event);
}

// สร้าง exploded view (แยกชิ้นส่วน)
function createExplodedView(model, exploded = true) {
    if (!model) return;
    
    const timeline = gsap.timeline();
    
    // หาชิ้นส่วนที่แยกได้
    const parts = [];
    model.traverse((object) => {
        if (object.isMesh && !object.name.startsWith('label_')) {
            parts.push(object);
        }
    });
    
    if (exploded) {
        // แยกชิ้นส่วนออกจากกัน
        parts.forEach((part) => {
            // กำหนดทิศทางการแยกชิ้นส่วน
            const direction = new THREE.Vector3();
            
            // คำนวณทิศทางจากจุดศูนย์กลางของโมเดล
            direction.subVectors(part.position, new THREE.Vector3(0, -1, 0)).normalize();
            
            // ถ้าทิศทางมีค่าใกล้ศูนย์มากไป ให้กำหนดเป็นแกน Y
            if (direction.length() < 0.1) {
                direction.set(0, 1, 0);
            }
            
            // กำหนดระยะทางตามขนาดชิ้นส่วน
            const distance = 0.5 + Math.random() * 0.5;
            
            // บันทึกตำแหน่งเดิมถ้ายังไม่มีการบันทึก
            if (!part.userData.originalPosition) {
                part.userData.originalPosition = part.position.clone();
            }
            
            // แอนิเมชันเคลื่อนย้ายชิ้นส่วน
            timeline.to(part.position, {
                x: part.position.x + direction.x * distance,
                y: part.position.y + direction.y * distance,
                z: part.position.z + direction.z * distance,
                duration: 1,
                ease: "power2.out"
            }, 0);
        });
    } else {
        // รวมชิ้นส่วนเข้าด้วยกัน
        parts.forEach((part) => {
            const originalPosition = part.userData.originalPosition;
            if (originalPosition) {
                timeline.to(part.position, {
                    x: originalPosition.x,
                    y: originalPosition.y,
                    z: originalPosition.z,
                    duration: 1,
                    ease: "power2.out"
                }, 0);
            }
        });
    }
    
    isExploded = exploded;
    return timeline;
}

// บันทึกตำแหน่งเดิมของชิ้นส่วนต่างๆ
function saveOriginalPositions(model) {
    if (!model) return;
    
    model.traverse((object) => {
        if (object.isMesh) {
            object.userData.originalPosition = {
                x: object.position.x,
                y: object.position.y,
                z: object.position.z
            };
        }
    });
}

// จัดการการปรับขนาดหน้าต่าง
function onWindowResize() {
    const container = document.getElementById('three-js-container');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}


// สร้างลูปแอนิเมชัน
function animate() {
    requestAnimationFrame(animate);
    
    // อัปเดตการควบคุม
    if (controls && typeof controls.update === 'function') {
        controls.update();
    }
    
    // อัปเดตสถิติถ้ามี
    if (stats) {
        stats.update();
    }
    
    // อัปเดต mixer สำหรับแอนิเมชันถ้ามี
    if (mixer) {
        mixer.update(clock.getDelta() * SETTINGS.animationSpeed);
    }
    
    // อัปเดตการหมุนโมเดลถ้าตั้งค่าอัตโนมัติ
    if (controls.autoRotate && currentModel) {
        currentModel.rotation.y += 0.005 * SETTINGS.animationSpeed;
    }
    
    // Render scene หรือใช้ effect composer
    try {
        if (effectComposer && SETTINGS.antialiasing) {
            effectComposer.render();
        } else {
            renderer.render(scene, camera);
        }
    } catch (error) {
        // กรณีมีข้อผิดพลาดในการ render ให้ใช้การ render แบบปกติ
        console.error('Error during rendering, falling back to normal render:', error);
        renderer.render(scene, camera);
    }
}
// สร้างป้ายชื่อ
function createLabels() {
    // สร้างป้ายชื่อสำหรับรูปแบบ Valve Gate
    createLabel("Manifold", 0, -1.3, 0, valveGateModel);
    createLabel("Valve Pin", -1, 0.3, 0.5, valveGateModel);
    createLabel("Hot Tip", 1, 0.8, 0.5, valveGateModel);
    createLabel("Heater", -1, -0.8, 0.5, valveGateModel);
    createLabel("Sprue", 0, -1, 0.5, valveGateModel);
    
    // สร้างป้ายชื่อสำหรับรูปแบบ Thermal Gate
    createLabel("Manifold", 0, -1.3, 0, thermalGateModel);
    createLabel("Thermal Gate", -1, 0.45, 0.5, thermalGateModel);
    createLabel("Hot Tip", 1, 0.45, 0.5, thermalGateModel);
    createLabel("Heater", -1, -0.8, 0.5, thermalGateModel);
    createLabel("Sprue", 0, -1, 0.5, thermalGateModel);
    
    // สร้างป้ายชื่อสำหรับรูปแบบ Open Tip
    createLabel("Manifold", 0, -1.3, 0, openTipModel);
    createLabel("Open Tip", -1, 0.05, 0.5, openTipModel);
    createLabel("Exit Gate", 1, 0.05, 0.5, openTipModel);
    createLabel("Heater", -1, -0.8, 0.5, openTipModel);
    createLabel("Sprue", 0, -1, 0.5, openTipModel);
}
// สร้างป้ายชื่อให้กับส่วนประกอบต่างๆ
function createLabel(text, x, y, z, parentModel) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // วาดพื้นหลังที่โปร่งใส
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // วาดขอบ
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // วาดข้อความ
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // สร้าง texture จาก canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // สร้าง sprite จาก texture
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0.9
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1, 0.5, 1);
    sprite.position.set(x, y, z);
    sprite.name = `label_${text}`;
    sprite.renderOrder = 10; // ให้แสดงทับส่วนอื่นๆ
    sprite.visible = false; // ซ่อนป้ายชื่อก่อน
    
    // เพิ่ม sprite เข้าไปในโมเดล
    if (parentModel) {
        parentModel.add(sprite);
        // เก็บป้ายชื่อไว้ในอาร์เรย์
        labels.push(sprite);
    }
    
    return sprite;
}

// เริ่มต้นระบบฟิสิกส์ (ถ้าเปิดใช้งาน)
function initPhysics() {
    // ในที่นี้จะเป็นการจำลองฟิสิกส์อย่างง่ายเท่านั้น
    // หากต้องการฟิสิกส์ที่สมจริงมากขึ้น อาจต้องใช้ไลบรารีเช่น AmmoJS หรือ CannonJS
    
    console.log('Physics system initialized');
}

///////////////////////////ทดสอบการวางไฟล์
// อัปเดต window.HotRunnerModels เพื่อเปิดเผยฟังก์ชันใหม่ทั้งหมด
// function enhanceHotRunnerModels() {
//     // เรียกใช้ฟังก์ชันเพิ่มความสามารถต่างๆ
//     const advancedMaterials = setupEnhancedMaterials();
//     const envMap = setupEnvironmentMap();
//     const advancedLighting = setupAdvancedLighting();
//     const temperatureViz = addTemperatureVisualization();
//     const flowAnalysis = addFlowAnalysisVisualization();
//     const cameraControls = setupAdvancedCameraControls();
//     const defectSystem = simulateMoldingDefects();
//     const performanceSystem = createPerformanceComparisonSystem();
//     const parameterSystem = createParameterMonitoringSystem();
// }

/////////////////////////////////////
// // เปิดเผยฟังก์ชันต่างๆ ให้สามารถใช้จากภายนอกได้
 window.HotRunnerModels = {
       
    initThreeJS,
    showModel,
    toggleLabels,
    animateValveGate,
    animatePlasticFlow,
    createExplodedView,
    saveOriginalPositions,
    resetCamera,
    resetModelPosition,
    setCameraView,
    stopAllAnimations,
    toggleWireframe,
    toggleBoundingBox,
    toggleHelpers,
     getPlasticFlowPaths,
    getModelByType,
    getCurrentModel: function() { return currentModel; },
    getCurrentModelType: function() { return currentModelType; }
    //   simulateHotRunnerOperation,
    //     createRealisticPlasticFlow,
    //     createVirtualProduct
 }
    
