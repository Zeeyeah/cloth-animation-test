import { GeometrySlicer } from '@/components/GeometrySlicer/GeometrySlicer';
import { ToolMode } from './UIState';
import { CutManager } from '@/components/GeometrySlicer/CutManager';

export class UIManager {
	private slicer: GeometrySlicer;
    private cutManager: CutManager;

	private selectedModel: string | null = null;
	private uploadedFile: File | null = null;

	constructor(slicer: GeometrySlicer, cutManager: CutManager) {
		this.slicer = slicer;
        this.cutManager = cutManager;
		this.initMenu();
		this.initToolbar();
	}

	private initMenu() {
		const cards = document.querySelectorAll('.model-card');
		const startBtn = document.querySelector('.start-button')!;

		const menuFileInput = document.querySelector('#menu-model-upload') as HTMLInputElement;
		const topModelSelect = document.querySelector('#top-model-select') as HTMLSelectElement;
		const topFileInput = document.querySelector('#top-model-upload') as HTMLInputElement;
		const dropzone = document.querySelector('.dropzone') as HTMLElement;

		const uploadTitle = document.querySelector('.upload-title')!;
		const uploadSubtitle = document.querySelector('.upload-subtitle')!;

		cards.forEach((card) => {
			card.addEventListener('click', () => {
				cards.forEach((c) => c.classList.remove('active'));

				card.classList.add('active');

				this.selectedModel = card.getAttribute('data-model-id');
				this.uploadedFile = null;

				uploadTitle.textContent = 'Drag & Drop GLTF/GLB';
				uploadSubtitle.textContent = 'or click to browse';

				this.updateStartButton();
			});
		});

		dropzone.addEventListener('dragover', (e) => {
			e.preventDefault();
			dropzone.classList.add('drag-over');
		});

		dropzone.addEventListener('dragleave', () => {
			dropzone.classList.remove('drag-over');
		});

		dropzone.addEventListener('drop', (e) => {
			e.preventDefault();

			const file = e.dataTransfer?.files[0];

			if (!file) return;

			this.uploadedFile = file;
			this.selectedModel = null;

			cards.forEach((c) => c.classList.remove('active'));

			uploadTitle.textContent = file.name;
			uploadSubtitle.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

			this.updateStartButton();
		});

		const updateMenuUploadState = (file: File) => {
			this.uploadedFile = file;
			this.selectedModel = null;

			cards.forEach((c) => c.classList.remove('active'));

			uploadTitle.textContent = file.name;
			uploadSubtitle.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
			this.updateStartButton();
		};

		menuFileInput.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;

			if (!target.files?.length) return;

			updateMenuUploadState(target.files[0]);
		});

		dropzone.addEventListener('drop', (e) => {
			e.preventDefault();

			const file = e.dataTransfer?.files[0];

			if (!file) return;

			updateMenuUploadState(file);
			dropzone.classList.remove('drag-over');
		});

		topModelSelect?.addEventListener('change', (event) => {
			const value = (event.target as HTMLSelectElement).value;

			if (!value) return;

			this.selectedModel = value;
			this.uploadedFile = null;
			this.slicer.loadDefaultModel(value);
		});

		topFileInput?.addEventListener('change', (event) => {
			const target = event.target as HTMLInputElement;
			if (!target.files?.length) return;

			this.uploadedFile = target.files[0];
			this.selectedModel = null;
			this.slicer.loadUploadedModel(this.uploadedFile);
		});

		startBtn.addEventListener('click', () => {
			if (this.uploadedFile) {
				this.slicer.loadUploadedModel(this.uploadedFile);
			} else if (this.selectedModel) {
				this.slicer.loadDefaultModel(this.selectedModel);
			}

			document.querySelector('.menu-overlay')?.classList.add('hidden');
		});
	}

	private updateStartButton() {
		const startBtn = document.querySelector('.start-button') as HTMLButtonElement;

		startBtn.disabled = !this.selectedModel && !this.uploadedFile;
	}

	private initToolbar() {
		const dragBtn = document.querySelector('.drag-btn') as HTMLButtonElement;

		const cutBtn = document.querySelector('.cut-btn') as HTMLButtonElement;

		const resetBtn = document.querySelector('.reset-btn') as HTMLButtonElement;

        const canvas = document.querySelector('.ui-overlay') as HTMLCanvasElement;

		dragBtn.addEventListener('click', () => {
			dragBtn.classList.add('active');
			cutBtn.classList.remove('active');

            canvas.style.cursor = 'grab';

			this.cutManager.setMode(ToolMode.DRAG);
		});

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Alt' && !cutBtn.classList.contains('active')) {
                cutBtn.classList.add('active');
                dragBtn.classList.remove('active');

                this.cutManager.setMode(ToolMode.CUT);
            }
        })

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Alt' ) {
                cutBtn.classList.remove('active');
                dragBtn.classList.add('active');

                this.cutManager.setMode(ToolMode.DRAG);
            }
        })

		cutBtn.addEventListener('click', () => {
			cutBtn.classList.add('active');
			dragBtn.classList.remove('active');

			this.cutManager.setMode(ToolMode.CUT);
		});

		resetBtn.addEventListener('click', () => {
			this.slicer.reset();
		});
	}
}
