import Gl from '@/Gl';
import {
	IcosahedronGeometry,
	SphereGeometry,
	MeshStandardMaterial,
	Mesh,
	PointsMaterial,
	Points,
	BufferGeometry,
	BufferAttribute,
	Vector3,
	Color,
	PointLight,
	HemisphereLight,
	DirectionalLight,
	AdditiveBlending,
	ShaderMaterial,
	Texture,
    LineBasicMaterial,
    Line
} from 'three';

interface Planet {
	mesh: Mesh;
	shell: Mesh;
	distance: number;
	angle: number;
	speed: number;
}

interface Particle {
	position: Vector3;
	velocity: Vector3;
	angle: number;
	radius: number;
	orbitPlanetIndex: number; // -1 for free particles, otherwise planet index
}

export class SolarSystem {
	private gl: Gl;
	private planets: Planet[] = [];
	private sun: Mesh;
	private sunShell: Mesh;
	private particles: Points;
	private particleData: Particle[] = [];
	private particlePositions: Float32Array;

	constructor() {
		this.gl = Gl.getInstance();
		this.setupLighting();
		this.createSun();
		this.createPlanets();
        this.createOrbitalPaths();
		this.createParticles();
		this.gl.useFrame(() => this.animate());
	}

	private setupLighting() {
		// Hemisphere light for overall ambient
		const hemiLight = new HemisphereLight(0x87ceeb, 0x1a1a2e, 0.8);
		this.gl.scene.add(hemiLight);

		// Sun light
		const sunLight = new PointLight(0xffd89b, 2.5, 1000);
		sunLight.position.set(0, 0, 0);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.camera.far = 2500;
		this.gl.scene.add(sunLight);

		// Soft directional for rim lighting
		const dirLight = new DirectionalLight(0xffffff, 0.5);
		dirLight.position.set(200, 200, 200);
		this.gl.scene.add(dirLight);
	}

	private createSun() {
		const sunGeometry = new SphereGeometry(1.5, 64, 64);
		const sunMaterial = new MeshStandardMaterial({
			color: 0xfdb813,
			emissive: 0xfdb813,
			emissiveIntensity: 10.2,
			metalness: 0.3,
			roughness: 0.4
		});

		this.sun = new Mesh(sunGeometry, sunMaterial);
		this.sun.castShadow = true;
		this.sun.receiveShadow = true;
		this.gl.scene.add(this.sun);

		// Translucent outer shell
		const shellGeometry = new SphereGeometry(1.7, 64, 64);
		const shellMaterial = new MeshStandardMaterial({
			color: 0xfdb813,
			emissive: 0xfdb813,
			emissiveIntensity: 0.5,
			metalness: 0.1,
			roughness: 0.8,
			transparent: true,
			opacity: 0.3,
			depthWrite: false
		});

		this.sunShell = new Mesh(shellGeometry, shellMaterial);
		this.sunShell.position.copy(this.sun.position);
		this.gl.scene.add(this.sunShell);
	}
    private createOrbitalPaths() {
	const orbitDistances = [8, 12, 16, 20, 28, 36, 44, 52];

	orbitDistances.forEach((distance) => {
		const points = [];
		const segments = 256;

		for (let i = 0; i <= segments; i++) {
			const angle = (i / segments) * Math.PI * 2;
			const x = Math.cos(angle) * distance;
			const z = Math.sin(angle) * distance;
			points.push(new Vector3(x, 0, z));
		}

		const orbitGeometry = new BufferGeometry().setFromPoints(points);
		const orbitMaterial = new LineBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.3,
			linewidth: 1
		});

		const orbit = new Line(orbitGeometry, orbitMaterial);
		this.gl.scene.add(orbit);
	});
}

	private createPlanets() {
		const planetData = [
			{
				name: 'Mercury',
				size: 0.38,
				distance: 8,
				speed: 0.04,
				color: 0x8c7853,
				metalness: 0.7,
				roughness: 0.3
			},
			{
				name: 'Venus',
				size: 0.95,
				distance: 12,
				speed: 0.015,
				color: 0xffc649,
				metalness: 0.6,
				roughness: 0.4
			},
			{
				name: 'Earth',
				size: 1.0,
				distance: 16,
				speed: 0.01,
				color: 0x4a90e2,
				metalness: 0.5,
				roughness: 0.5
			},
			{
				name: 'Mars',
				size: 0.53,
				distance: 20,
				speed: 0.008,
				color: 0xe27b58,
				metalness: 0.6,
				roughness: 0.6
			},
			{
				name: 'Jupiter',
				size: 2.0,
				distance: 28,
				speed: 0.002,
				color: 0xc88b3a,
				metalness: 0.4,
				roughness: 0.6
			},
			{
				name: 'Saturn',
				size: 1.8,
				distance: 36,
				speed: 0.0009,
				color: 0xf4d4a6,
				metalness: 0.35,
				roughness: 0.65
			},
			{
				name: 'Uranus',
				size: 1.3,
				distance: 44,
				speed: 0.0004,
				color: 0x4fd0e7,
				metalness: 0.5,
				roughness: 0.5
			},
			{
				name: 'Neptune',
				size: 1.24,
				distance: 52,
				speed: 0.0001,
				color: 0x4166f5,
				metalness: 0.55,
				roughness: 0.45
			}
		];

		planetData.forEach((data, index) => {
			const geometry = new IcosahedronGeometry(data.size, 64);
			const material = new MeshStandardMaterial({
				color: new Color(data.color),
				metalness: data.metalness,
				roughness: data.roughness,
				emissive: new Color(data.color).multiplyScalar(0.2),
				emissiveIntensity: 0.3
			});

			const planet = new Mesh(geometry, material);
			planet.castShadow = true;
			planet.receiveShadow = true;

			// Translucent shell layer
			const shellGeometry = new IcosahedronGeometry(data.size * 1.15, 64);
			const shellMaterial = new MeshStandardMaterial({
				color: new Color(data.color),
				emissive: new Color(data.color).multiplyScalar(0.3),
				emissiveIntensity: 0.2,
				metalness: data.metalness * 0.5,
				roughness: data.roughness + 0.2,
				transparent: true,
				opacity: 0.25,
				depthWrite: false
			});

			const shell = new Mesh(shellGeometry, shellMaterial);
			planet.add(shell); // Attach shell to planet so they orbit together

			// Store planet data
			const planetObj: Planet = {
				mesh: planet,
				shell: shell,
				distance: data.distance,
				angle: Math.random() * Math.PI * 2,
				speed: data.speed * 0.01
			};

			this.planets.push(planetObj);

			// Position planet
			planet.position.x = Math.cos(planetObj.angle) * data.distance;
			planet.position.z = Math.sin(planetObj.angle) * data.distance;

			this.gl.scene.add(planet);
		});
	}

	private createParticles() {
	const particleCount = 2000;
	const particleGeometry = new BufferGeometry();

	const positions = new Float32Array(particleCount * 3);
	const colors = new Float32Array(particleCount * 3);

	// Create particle data with orbital mechanics
	this.particleData = [];
	const minDistance = 60; // Minimum distance from solar system center
	
	for (let i = 0; i < particleCount; i++) {
		let particle: Particle;
		let validPosition = false;

		// Keep generating until we have a position outside the solar system
		while (!validPosition) {
			const x = (Math.random() - 0.5) * 200;
			const y = (Math.random() - 0.5) * 200;
			const z = (Math.random() - 0.5) * 200;
			
			const distance = Math.sqrt(x * x + y * y + z * z);
			
			if (distance > minDistance) {
				particle = {
					position: new Vector3(x, y, z),
					velocity: new Vector3(
						(Math.random() - 0.5) * 0.02,
						(Math.random() - 0.5) * 0.02,
						(Math.random() - 0.5) * 0.02
					),
					angle: Math.random() * Math.PI * 2,
					radius: Math.random() * 40,
					orbitPlanetIndex: -1
				};
				validPosition = true;
			}
		}

		this.particleData.push(particle!);

		// Initialize positions
		positions[i * 3] = particle!.position.x;
		positions[i * 3 + 1] = particle!.position.y;
		positions[i * 3 + 2] = particle!.position.z;

		// Color gradient: blue to cyan to white
		const lerpFactor = Math.random();
		const r = 0.4 + lerpFactor * 0.6;
		const g = 0.7 + lerpFactor * 0.3;
		const b = 1.0;

		colors[i * 3] = r;
		colors[i * 3 + 1] = g;
		colors[i * 3 + 2] = b;
	}

	this.particlePositions = positions;

	particleGeometry.setAttribute('position', new BufferAttribute(positions, 3));
	particleGeometry.setAttribute('color', new BufferAttribute(colors, 3));

	const particleMaterial = new PointsMaterial({
		size: 0.2,
		sizeAttenuation: true,
		vertexColors: true,
		transparent: true,
		opacity: 0.8,
		blending: AdditiveBlending
	});

	this.particles = new Points(particleGeometry, particleMaterial);
	this.gl.scene.add(this.particles);
}

	private animate() {
		const elapsed = this.gl.clock.getElapsedTime();

		// Rotate sun and shell
		this.sun.rotation.y += 0.001;
		this.sunShell.rotation.y -= 0.0005;
		this.sunShell.scale.x = 1 + Math.sin(elapsed * 0.5) * 0.05;
		this.sunShell.scale.y = 1 + Math.sin(elapsed * 0.5) * 0.05;
		this.sunShell.scale.z = 1 + Math.sin(elapsed * 0.5) * 0.05;

		// Orbit planets
		this.planets.forEach((planet) => {
			planet.angle += planet.speed;

			const x = Math.cos(planet.angle) * planet.distance;
			const z = Math.sin(planet.angle) * planet.distance;

			planet.mesh.position.x = x;
			planet.mesh.position.z = z;

			// Rotate planets and shells
			planet.mesh.rotation.x += 0.001;
			planet.mesh.rotation.y += 0.003;
			planet.shell.rotation.x -= 0.0008;
			planet.shell.rotation.y -= 0.002;

			// Shell pulsing scale
			const pulseScale = 1 + Math.sin(elapsed + planet.distance) * 0.08;
			planet.shell.scale.setScalar(pulseScale);
		});

		// Update particles
		this.particleData.forEach((particle, index) => {
			if (particle.orbitPlanetIndex >= 0) {
				// Orbit around planet
				const planet = this.planets[particle.orbitPlanetIndex];
				particle.angle += 0.01;

				const px = planet.mesh.position.x;
				const pz = planet.mesh.position.z;

				const x = px + Math.cos(particle.angle) * particle.radius;
				const y = Math.sin(elapsed * 0.5 + index) * particle.radius * 0.5;
				const z = pz + Math.sin(particle.angle) * particle.radius;

				particle.position.set(x, y, z);
			} else {
				// Free floating with swirling motion
				particle.angle += 0.001;
				const waveX = Math.sin(elapsed * 0.3 + index * 0.01) * 3;
				const waveY = Math.cos(elapsed * 0.25 + index * 0.015) * 3;

				particle.position.x += particle.velocity.x;
				particle.position.y += particle.velocity.y + waveY * 0.001;
				particle.position.z += particle.velocity.z;

				// Wrap around bounds
				const bound = 75;
				if (Math.abs(particle.position.x) > bound) particle.velocity.x *= -1;
				if (Math.abs(particle.position.y) > bound) particle.velocity.y *= -1;
				if (Math.abs(particle.position.z) > bound) particle.velocity.z *= -1;
			}

			this.particlePositions[index * 3] = particle.position.x;
			this.particlePositions[index * 3 + 1] = particle.position.y;
			this.particlePositions[index * 3 + 2] = particle.position.z;
		});

		// Update geometry
		// (this.particles.geometry.attributes.position as BufferAttribute).needsUpdate = true;
	}

	public destroy() {
		this.planets.forEach((planet) => {
			this.gl.scene.remove(planet.mesh);
		});
		this.gl.scene.remove(this.sun);
		this.gl.scene.remove(this.sunShell);
		this.gl.scene.remove(this.particles);
	}
}

export default SolarSystem;