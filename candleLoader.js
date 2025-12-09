/**
 * Candle GLTF Loader Module
 * Loads a low poly candle model onto the game board using THREE.js
 * NOTE: Requires THREE.GLTFLoader to be loaded globally
 */

class CandleLoader {
    constructor(scene) {
        this.scene = scene;
        this.loader = new THREE.GLTFLoader();
        this.candle = null;
        this.flame = null;
        this.flameLight = null;
        this.flameTime = 0;
    }

    /**
     * Load the candle GLTF model with textures
     * @param {Object} options - Configuration options
     * @param {number} options.x - X position on the board
     * @param {number} options.y - Y position on the board
     * @param {number} options.z - Z position on the board
     * @param {number} options.scale - Scale of the model (default: 1)
     * @param {number} options.rotation - Rotation in radians (default: 0)
     * @returns {Promise} Resolves when model is loaded
     */
    loadCandle(options = {}) {
        const {
            x = 0,
            y = 0,
            z = 0,
            scale = 0.1,
            rotation = 0
        } = options;

        return new Promise((resolve, reject) => {
            // Load the GLTF model
            this.loader.load(
                // Path to GLTF file
                './low_poly_candle_charliesketch_sketchfab/scene.gltf',

                // Success callback
                (gltf) => {
                    console.log('Candle model loaded successfully!');

                    this.candle = gltf.scene;

                    // Position the candle
                    this.candle.position.set(x, y, z);

                    // Scale the candle (GLTF models can be large)
                    this.candle.scale.set(scale, scale, scale);

                    // Rotate the candle
                    this.candle.rotation.y = rotation;

                    // Enable shadows for all meshes in the model
                    this.candle.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            // Ensure the material properly uses the textures
                            if (child.material) {
                                child.material.needsUpdate = true;
                            }
                        }
                    });

                    // Add to scene
                    this.scene.add(this.candle);

                    // Create flame and light above the candle
                    this.createFlame(x, y, z, scale);

                    resolve(this.candle);
                },

                // Progress callback
                (xhr) => {
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    console.log(`Candle model ${percentComplete.toFixed(2)}% loaded`);
                },

                // Error callback
                (error) => {
                    console.error('Error loading candle model:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Create an animated flame with light
     * @private
     */
    createFlame(x, y, z, candleScale) {
        // Create flame group to hold multiple parts
        this.flame = new THREE.Group();

        // Main flame (cone shape)
        const flameGeometry = new THREE.ConeGeometry(0.3, 1.0, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa500,
            transparent: true,
            opacity: 0.8
        });
        const mainFlame = new THREE.Mesh(flameGeometry, flameMaterial);
        mainFlame.position.y = 0.5; // Half height to base it at origin
        this.flame.add(mainFlame);

        // Inner flame (brighter, smaller)
        const innerFlameGeometry = new THREE.ConeGeometry(0.15, 0.7, 8);
        const innerFlameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
        innerFlame.position.y = 0.4;
        this.flame.add(innerFlame);

        // Store references for animation
        this.mainFlame = mainFlame;
        this.innerFlame = innerFlame;

        // Position flame above candle
        // The candle model is roughly 17 units tall in its local space, scaled down
        const flameHeight = 17 * candleScale; // Approximate top of candle
        this.flame.position.set(x, y + flameHeight, z);
        this.flame.scale.set(candleScale * 2, candleScale * 2, candleScale * 2);

        this.scene.add(this.flame);

        // Create point light for flame glow
        this.flameLight = new THREE.PointLight(0xff6600, 1.5, 10);
        this.flameLight.position.set(x, y + flameHeight + 0.5, z);
        this.flameLight.castShadow = true;
        this.flameLight.shadow.camera.near = 0.1;
        this.flameLight.shadow.camera.far = 10;

        this.scene.add(this.flameLight);
    }

    /**
     * Remove the candle from the scene
     */
    removeCandle() {
        if (this.candle) {
            this.scene.remove(this.candle);
            this.candle = null;
        }
        if (this.flame) {
            this.scene.remove(this.flame);
            this.flame = null;
        }
        if (this.flameLight) {
            this.scene.remove(this.flameLight);
            this.flameLight = null;
        }
    }

    /**
     * Update candle position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    updatePosition(x, y, z) {
        if (this.candle) {
            this.candle.position.set(x, y, z);
        }
    }

    /**
     * Animate the flame with flickering effect
     * Call this in your animation loop
     * @param {number} deltaTime - Time since last frame in seconds (optional)
     */
    animate(deltaTime = 0.016) {
        if (!this.flame || !this.flameLight) return;

        this.flameTime += deltaTime;

        // Flicker intensity - varying speeds for more natural look
        const flicker1 = Math.sin(this.flameTime * 8) * 0.03;
        const flicker2 = Math.sin(this.flameTime * 12.5) * 0.02;
        const flicker3 = Math.sin(this.flameTime * 20) * 0.015;

        const totalFlicker = flicker1 + flicker2 + flicker3;

        // Animate main flame
        if (this.mainFlame) {
            // Scale variation for flickering
            const scaleVar = 1.0 + totalFlicker;
            this.mainFlame.scale.set(scaleVar, scaleVar, scaleVar);

            // Slight position wobble
            this.mainFlame.position.x = Math.sin(this.flameTime * 5) * 0.02;
        }

        // Animate inner flame (slightly different timing)
        if (this.innerFlame) {
            const innerScale = 1.0 + totalFlicker * 1.2;
            this.innerFlame.scale.set(innerScale, innerScale, innerScale);
            this.innerFlame.position.x = Math.sin(this.flameTime * 6) * 0.015;
        }

        // Animate light intensity
        if (this.flameLight) {
            this.flameLight.intensity = 1.5 + totalFlicker * 2;

            // Slight position variation for light
            const lightBaseY = this.flameLight.position.y;
            this.flameLight.position.y = lightBaseY + totalFlicker * 0.1;
        }
    }
}

// Export for use as a global or module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CandleLoader };
} else if (typeof window !== 'undefined') {
    window.CandleLoader = CandleLoader;
}
