import {
	AdditiveBlending,
	DynamicDrawUsage,
	InstancedMesh,
	Matrix4,
	Object3D,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	Texture,
	Vector3
} from 'three';

import Gl from '@/Gl';

import FireFlyShader from '@/shaders/FireFlyShader';
import UseGUI from '@/utils/UseGUI';

type Props = {
	groupCount: number;
	firefliesPerGroup: number;
	groupRadius: number;
	noiseTexture: Texture | null;
};

const defaultProps = {
	groupCount: 1,
	firefliesPerGroup: 50,
	groupRadius: 2,
	noiseTexture: null
};

export class FireFlies {
	private gl: Gl;
	private scene: Scene;
	private fireflyParticles: InstancedMesh;
	private fireflyCount: number;
	private Uniforms = {
		uTime: { value: 0 },
		uFireFlyRadius: { value: 0.1 },
		uPlayerPosition: { value: new Vector3(0, 0, 0) },
		uNoiseTexture: { value: new Texture() }
	};
	private groupCount: number;
	private firefliesPerGroup: number;
	private groupRadius: number;

	constructor(props: Props = defaultProps) {
		this.gl = Gl.getInstance();
		this.scene = this.gl.scene;
		this.setupGUI();
		this.init(props);
		this.update();
	}

	private init(props: Props) {
		this.groupCount = props.groupCount;
		this.groupRadius = props.groupRadius;
		this.firefliesPerGroup = props.firefliesPerGroup;
		if (props.noiseTexture) {
			this.Uniforms.uNoiseTexture.value = props.noiseTexture;
		}

		// Create a firefly geometry
		const fireflyGeometry = new PlaneGeometry(0.2, 0.2); // Adjust the size of the firefly as desired

		// Create a firefly material
		const fireflyMaterial = new ShaderMaterial({
			transparent: true,
			blending: AdditiveBlending,
			uniforms: {
				uTime: this.Uniforms.uTime,
				uFireFlyRadius: this.Uniforms.uFireFlyRadius,
				uNoiseTexture: this.Uniforms.uNoiseTexture
			},
			vertexShader: FireFlyShader.vertex,
			fragmentShader: FireFlyShader.fragment
		});

		// Create a firefly object using instanced rendering
		this.fireflyCount = this.groupCount * this.firefliesPerGroup;
		this.fireflyParticles = new InstancedMesh(
			fireflyGeometry,
			fireflyMaterial,
			this.fireflyCount
		);

		// Set initial positions for the fireflies
		this.setInitialPositions(this.groupCount, this.firefliesPerGroup);
		this.scene.add(this.fireflyParticles);
	}

	setInitialPositions(groupCount: number, firefliesPerGroup: number) {
		this.fireflyParticles.instanceMatrix.setUsage(DynamicDrawUsage); // Set usage to DynamicDraw

		const position = new Vector3();
		const matrix = new Matrix4();

		for (let i = 0; i < groupCount; i++) {
			// Calculate a random center position for each group within a range
			const groupCenter = new Vector3(
				// Math.random() * 3000 - 1500,
				// 200 - Math.random() * 100,
				// Math.random() * 3000 - 1500
				0,
				0,
				0
			);

			// Set positions for fireflies within the group
			for (let j = 0; j < firefliesPerGroup; j++) {
				// Calculate a random offset within the group
				const offset = new Vector3(
					this.randomGaussian() * this.groupRadius,
					this.randomGaussian() * this.groupRadius,
					this.randomGaussian() * this.groupRadius
				);

				// Calculate the final position by adding the group center and the offset
				position.copy(groupCenter).add(offset);

				// Set the matrix position for the firefly
				matrix.setPosition(position);
				const index = i * firefliesPerGroup + j; // Calculate the index within the instanced mesh
				this.fireflyParticles.setMatrixAt(index, matrix);
			}
		}
		this.fireflyParticles.renderOrder = 1;
		this.fireflyParticles.instanceMatrix.needsUpdate = true;
	}

	update() {
		this.gl.useFrame(() => {
			this.Uniforms.uTime.value += this.gl.delta;
		});
	}

	private randomGaussian() {
		let u = 0,
			v = 0;
		while (u === 0) u = Math.random(); // Convert [0,1) to (0,1)
		while (v === 0) v = Math.random();
		const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
		return num;
	}

	private setupGUI() {
		const fireflyFolder = UseGUI.getInstance().addFolder('Firelies');
		fireflyFolder
			.add(this.Uniforms.uFireFlyRadius, 'value', 0.01, 1, 0.01)
			.name('Firefly Radius')
			.onChange((value: number) => {
				this.Uniforms.uFireFlyRadius.value = value;
			});
	}
}
