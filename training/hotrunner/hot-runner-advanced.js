/**
 * hot-runner-advanced.js
 * Advanced features for realistic Hot Runner 3D simulation
 * - Physics Engine (Ammo.js)
 * - PBR Materials
 * - Thermal Visualization
 * - Fluid Dynamics
 * - Sound Effects
 * - Post-processing
 */

// ========== Global Advanced Variables ==========
let physicsWorld = null;
let rigidBodies = [];
let tmpTrans = null;
let thermalEnabled = false;
let physicsEnabled = false;
let soundEnabled = true;
let ultraQuality = false;
let audioContext = null;
let machineSound = null;
let plasticFlowSound = null;

// ========== Physics Engine Setup (Ammo.js) ==========
async function initPhysicsEngine() {
    try {
        await Ammo();
        console.log('Ammo.js Physics Engine loaded');
        
        // Setup physics world
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
        
        physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            dispatcher,
            overlappingPairCache,
            solver,
            collisionConfiguration
        );
        
        // Set gravity (simulating hot plastic flow)
        physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
        
        tmpTrans = new Ammo.btTransform();
        
        physicsEnabled = true;
        updatePhysicsDebug();
        
        return true;
    } catch (error) {
        console.error('Failed to initialize physics engine:', error);
        return false;
    }
}

// Create physics body for object
function createRigidBody(mesh, mass, shape) {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
    ));
    
    const quaternion = mesh.quaternion;
    transform.setRotation(new Ammo.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
    ));
    
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    
    if (mass > 0) {
        shape.calculateLocalInertia(mass, localInertia);
    }
    
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        shape,
        localInertia
    );
    
    const body = new Ammo.btRigidBody(rbInfo);
    
    // Set friction and restitution for realistic behavior
    body.setFriction(0.5);
    body.setRestitution(0.3);
    
    physicsWorld.addRigidBody(body);
    
    mesh.userData.physicsBody = body;
    rigidBodies.push({ mesh: mesh, body: body });
    
    return body;
}

// Update physics simulation
function updatePhysics(deltaTime) {
    if (!physicsWorld) return;
    
    physicsWorld.stepSimulation(deltaTime, 10);
    
    // Update mesh positions from physics bodies
    for (let i = 0; i < rigidBodies.length; i++) {
        const objThree = rigidBodies[i].mesh;
        const objPhys = rigidBodies[i].body;
        const ms = objPhys.getMotionState();
        
        if (ms) {
            ms.getWorldTransform(tmpTrans);
            const p = tmpTrans.getOrigin();
            const q = tmpTrans.getRotation();
            
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
    
    updatePhysicsDebug();
}

// ========== PBR Material System ==========
function createPBRMaterial(config) {
    const material = new THREE.MeshStandardMaterial({
        color: config.color || 0xffffff,
        metalness: config.metalness || 0.5,
        roughness: config.roughness || 0.5,
        envMapIntensity: config.envMapIntensity || 1.0,
        emissive: config.emissive || 0x000000,
        emissiveIntensity: config.emissiveIntensity || 0
    });
    
    // Load textures if provided
    if (config.map) material.map = new THREE.TextureLoader().load(config.map);
    if (config.normalMap) material.normalMap = new THREE.TextureLoader().load(config.normalMap);
    if (config.roughnessMap) material.roughnessMap = new THREE.TextureLoader().load(config.roughnessMap);
    if (config.metalnessMap) material.metalnessMap = new THREE.TextureLoader().load(config.metalnessMap);
    if (config.aoMap) material.aoMap = new THREE.TextureLoader().load(config.aoMap);
    
    return material;
}

// Material presets for Hot Runner components
const PBRMaterials = {
    steel: createPBRMaterial({
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.3,
        envMapIntensity: 1.5
    }),
    brass: createPBRMaterial({
        color: 0xb5a642,
        metalness: 0.8,
        roughness: 0.4,
        envMapIntensity: 1.2
    }),
    heater: createPBRMaterial({
        color: 0xff6600,
        metalness: 0.6,
        roughness: 0.5,
        emissive: 0xff3300,
        emissiveIntensity: 0.5
    }),
    plastic: createPBRMaterial({
        color: 0x00ff00,
        metalness: 0.1,
        roughness: 0.8,
        envMapIntensity: 0.5
    }),
    ceramic: createPBRMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.7,
        envMapIntensity: 0.3
    })
};

// ========== Thermal Visualization ==========
function initThermalVisualization() {
    thermalEnabled = true;
    document.getElementById('thermal-overlay').style.display = 'block';
    
    // Apply thermal shader to all heater components
    if (currentModel) {
        currentModel.traverse((object) => {
            if (object.isMesh && object.name && object.name.includes('heater')) {
                applyThermalShader(object);
            }
        });
    }
}

function applyThermalShader(mesh) {
    // Custom shader for thermal visualization
    const thermalMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            temperature: { value: 250.0 }, // Default temperature in Celsius
            minTemp: { value: 50.0 },
            maxTemp: { value: 300.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float temperature;
            uniform float minTemp;
            uniform float maxTemp;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            vec3 temperatureToColor(float temp) {
                float normalized = (temp - minTemp) / (maxTemp - minTemp);
                normalized = clamp(normalized, 0.0, 1.0);
                
                vec3 color;
                if (normalized < 0.25) {
                    color = mix(vec3(0.0, 0.6, 1.0), vec3(0.0, 1.0, 0.0), normalized * 4.0);
                } else if (normalized < 0.5) {
                    color = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (normalized - 0.25) * 4.0);
                } else if (normalized < 0.75) {
                    color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.6, 0.0), (normalized - 0.5) * 4.0);
                } else {
                    color = mix(vec3(1.0, 0.6, 0.0), vec3(1.0, 0.0, 0.0), (normalized - 0.75) * 4.0);
                }
                
                return color;
            }
            
            void main() {
                // Add some noise for realistic temperature variation
                float noise = sin(vPosition.x * 10.0 + time) * 
                             cos(vPosition.y * 10.0 + time) * 0.1;
                float localTemp = temperature + noise * 20.0;
                
                vec3 color = temperatureToColor(localTemp);
                
                // Add pulsing effect
                float pulse = sin(time * 2.0) * 0.1 + 0.9;
                color *= pulse;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
    
    mesh.userData.originalMaterial = mesh.material;
    mesh.userData.thermalMaterial = thermalMaterial;
    mesh.material = thermalMaterial;
}

function updateThermalVisualization(deltaTime) {
    if (!thermalEnabled || !currentModel) return;
    
    currentModel.traverse((object) => {
        if (object.userData.thermalMaterial) {
            object.userData.thermalMaterial.uniforms.time.value += deltaTime;
            
            // Simulate temperature changes based on heating cycle
            const baseTemp = 250;
            const variation = Math.sin(object.userData.thermalMaterial.uniforms.time.value * 0.5) * 25;
            object.userData.thermalMaterial.uniforms.temperature.value = baseTemp + variation;
        }
    });
}

function disableThermalVisualization() {
    thermalEnabled = false;
    document.getElementById('thermal-overlay').style.display = 'none';
    
    if (currentModel) {
        currentModel.traverse((object) => {
            if (object.userData.originalMaterial) {
                object.material = object.userData.originalMaterial;
            }
        });
    }
}

// ========== Advanced Particle System (Fluid Dynamics) ==========
class FluidParticle {
    constructor(position, velocity) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.acceleration = new THREE.Vector3();
        this.mass = 0.01;
        this.radius = 0.02;
        this.temperature = 250; // Celsius
        this.viscosity = 0.3;
        this.lifespan = 1.0;
        this.age = 0;
    }
    
    applyForce(force) {
        const f = force.clone().divideScalar(this.mass);
        this.acceleration.add(f);
    }
    
    update(deltaTime) {
        // Update velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Apply viscosity (resistance)
        this.velocity.multiplyScalar(1 - this.viscosity * deltaTime);
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Cool down over time
        this.temperature -= 50 * deltaTime;
        
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Age
        this.age += deltaTime;
    }
    
    isDead() {
        return this.age >= this.lifespan;
    }
    
    getColor() {
        // Color based on temperature
        const t = Math.min(Math.max(this.temperature / 300, 0), 1);
        const r = t;
        const g = t * 0.5;
        const b = 0;
        return new THREE.Color(r, g, b);
    }
}

function createAdvancedFluidSimulation() {
    const particles = [];
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMeshes = [];
    
    // Spawn particles from nozzle
    for (let i = 0; i < 50; i++) {
        const position = new THREE.Vector3(0, 1, 0);
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            -2 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        const particle = new FluidParticle(position, velocity);
        particles.push(particle);
        
        const material = new THREE.MeshBasicMaterial({
            color: particle.getColor(),
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(particleGeometry, material);
        mesh.position.copy(particle.position);
        scene.add(mesh);
        particleMeshes.push(mesh);
    }
    
    return { particles, particleMeshes };
}

function updateFluidSimulation(fluidSystem, deltaTime) {
    const { particles, particleMeshes } = fluidSystem;
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Apply gravity
        particle.applyForce(new THREE.Vector3(0, -9.81 * particle.mass, 0));
        
        // Update particle
        particle.update(deltaTime);
        
        // Update mesh
        if (particleMeshes[i]) {
            particleMeshes[i].position.copy(particle.position);
            particleMeshes[i].material.color.copy(particle.getColor());
            particleMeshes[i].material.opacity = 1 - (particle.age / particle.lifespan);
        }
        
        // Remove dead particles
        if (particle.isDead()) {
            scene.remove(particleMeshes[i]);
            particleMeshes[i].geometry.dispose();
            particleMeshes[i].material.dispose();
            particles.splice(i, 1);
            particleMeshes.splice(i, 1);
        }
    }
}

// ========== Sound System ==========
function initSoundSystem() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create machine sound (low frequency hum)
        createMachineSound();
        
        // Create plastic flow sound
        createPlasticFlowSound();
        
        console.log('Sound system initialized');
    } catch (error) {
        console.error('Failed to initialize sound system:', error);
        soundEnabled = false;
    }
}

function createMachineSound() {
    if (!audioContext) return;
    
    // Create oscillator for machine hum
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime); // 60 Hz
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    
    machineSound = { oscillator, gainNode };
}

function createPlasticFlowSound() {
    if (!audioContext) return;
    
    // Create noise for plastic flow
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, audioContext.currentTime);
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noise.start();
    
    plasticFlowSound = { noise, filter, gainNode };
}

function playMachineSound() {
    if (!soundEnabled || !machineSound) return;
    
    machineSound.gainNode.gain.linearRampToValueAtTime(
        0.1,
        audioContext.currentTime + 0.5
    );
}

function stopMachineSound() {
    if (!machineSound) return;
    
    machineSound.gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + 0.5
    );
}

function playPlasticFlowSound() {
    if (!soundEnabled || !plasticFlowSound) return;
    
    plasticFlowSound.gainNode.gain.linearRampToValueAtTime(
        0.05,
        audioContext.currentTime + 0.5
    );
}

function stopPlasticFlowSound() {
    if (!plasticFlowSound) return;
    
    plasticFlowSound.gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + 0.5
    );
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('sound-icon');
    
    if (soundEnabled) {
        icon.className = 'fas fa-volume-up';
    } else {
        icon.className = 'fas fa-volume-mute';
        stopMachineSound();
        stopPlasticFlowSound();
    }
}

// ========== Post-Processing Effects ==========
function setupAdvancedPostProcessing() {
    if (!renderer || !scene || !camera) return;
    
    // Create effect composer
    const composer = new THREE.EffectComposer(renderer);
    
    // Render pass
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // SSAO (Screen Space Ambient Occlusion)
    const ssaoPass = new THREE.SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    composer.addPass(ssaoPass);
    
    // Bloom effect
    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    composer.addPass(bloomPass);
    
    // FXAA (Anti-aliasing)
    const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
    );
    composer.addPass(fxaaPass);
    
    return composer;
}

// ========== Debug and UI Updates ==========
function updatePhysicsDebug() {
    if (!physicsEnabled) return;
    
    const statusEl = document.getElementById('physics-status');
    const objectsEl = document.getElementById('physics-objects');
    const fpsEl = document.getElementById('physics-fps');
    
    if (statusEl) statusEl.textContent = 'Active';
    if (objectsEl) objectsEl.textContent = rigidBodies.length;
    if (fpsEl) {
        const fps = Math.round(1 / clock.getDelta());
        fpsEl.textContent = fps;
    }
}

function togglePhysicsDebug() {
    const debugEl = document.getElementById('physics-debug');
    if (debugEl.style.display === 'none') {
        debugEl.style.display = 'block';
    } else {
        debugEl.style.display = 'none';
    }
}

function toggleUltraQuality() {
    ultraQuality = !ultraQuality;
    
    if (ultraQuality) {
        // Enable all high-quality features
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        
        // Enable post-processing
        if (!effectComposer) {
            effectComposer = setupAdvancedPostProcessing();
        }
        
        console.log('Ultra quality mode enabled');
    } else {
        // Disable for performance
        renderer.shadowMap.type = THREE.BasicShadowMap;
        renderer.toneMapping = THREE.NoToneMapping;
        effectComposer = null;
        
        console.log('Ultra quality mode disabled');
    }
}

// ========== Export Functions ==========
window.HotRunnerAdvanced = {
    initPhysicsEngine,
    createRigidBody,
    updatePhysics,
    PBRMaterials,
    initThermalVisualization,
    disableThermalVisualization,
    updateThermalVisualization,
    createAdvancedFluidSimulation,
    updateFluidSimulation,
    initSoundSystem,
    playMachineSound,
    stopMachineSound,
    playPlasticFlowSound,
    stopPlasticFlowSound,
    toggleSound,
    setupAdvancedPostProcessing,
    togglePhysicsDebug,
    toggleUltraQuality
};

console.log('Hot Runner Advanced Features loaded');
