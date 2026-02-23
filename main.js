/**
 * @file main.js v5.4.0-3
 * @description Script for the Link Peeker extension's settings panel.
 */

const defaultSettings = {
	language: 'en',
	triggerKey: { ctrl: false, shift: false, alt: true, meta: false },
	theme: 'auto',
	popupTheme: 'auto',
	popupBlur: 4,
	sidebarState: 'expanded', // expanded, collapsed, label
	sidebarMode: 'auto', // auto, manual
	nativeMode: false,
	hijackNewTab: false,
	utmCleaner: true,
	utmParams: 'utm_source, utm_medium, utm_campaign, fbclid, gclid',
	maliciousBlocker: false,
	blocklist: '',
	plugins: [],
};

let currentSettings = {};
let translations = {};

// --- UTILITY FUNCTIONS ---
async function loadTranslations(lang) {
	try {
		const response = await fetch(`_locales/${lang}/messages.json`);
		const data = await response.json();
		translations = data;
		applyTranslations();
	} catch (error) {
		console.error('Failed to load translations:', error);
	}
}

function getMessage(key) {
	return translations[key]?.message || chrome.i18n.getMessage(key) || key;
}

function applyTranslations() {
	document.querySelectorAll('[data-i18n]').forEach((el) => {
		const key = el.dataset.i18n;
		const message = getMessage(key);
		const textSpan = el.querySelector('span[data-i18n]') || el.querySelector('span') || el;
		if (textSpan !== el) {
			textSpan.textContent = message;
		} else {
			const icon = el.querySelector('svg');
			if (icon) {
				const span = document.createElement('span');
				span.textContent = message;
				el.innerHTML = '';
				el.appendChild(icon);
				el.appendChild(span);
			} else {
				el.textContent = message;
			}
		}
	});
}

let saveTimeout = null;
function saveSettings(newSettings) {
	Object.assign(currentSettings, newSettings);
	if (newSettings.language) loadTranslations(newSettings.language);

	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => {
		chrome.storage.sync.set(currentSettings, () => {
			if (chrome.runtime.lastError) {
				console.warn('Storage sync failed:', chrome.runtime.lastError);
			}
		});
	}, 1000);
}

function loadSettings(callback) {
	chrome.storage.sync.get(defaultSettings, (items) => {
		currentSettings = items;
		if (callback) callback(items);
	});
}

function applyPanelTheme(theme) {
	let panelTheme = theme;
	if (theme === 'auto') {
		panelTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	document.documentElement.dataset.theme = panelTheme;
	localStorage.setItem('theme', theme);
}

// --- PLUGIN MANAGEMENT ---
function renderPlugins(plugins) {
	const list = document.getElementById('plugins-list');
	if (!list) return;
	list.innerHTML = '';

	if (!plugins || plugins.length === 0) {
		list.innerHTML = '<div class="setting-item"><div class="setting-info"><div class="setting-title">No plugins installed</div></div></div>';
		return;
	}

	plugins.forEach((p, i) => {
		const item = document.createElement('div');
		item.className = 'setting-item';
		item.innerHTML = `
			<div class="setting-info">
				<div class="setting-title">${p.name}</div>
				<div class="setting-desc">${p.matches ? p.matches[0] : ''}</div>
			</div>
			<div style="display: flex; gap: 0.5rem">
				<button class="button edit-plugin-btn" data-index="${i}">Edit</button>
				<button class="button is-danger delete-plugin-btn" data-index="${i}">Delete</button>
			</div>
		`;
		list.appendChild(item);
	});
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
	const elements = {
		sidebar: document.getElementById('sidebar'),
		sidebarToggle: document.getElementById('sidebar-toggle'),
		sidebarLabel: document.querySelector('.menu-label'),
		edgeTrigger: document.getElementById('edge-trigger'),
		navIndicator: document.getElementById('nav-indicator'),
		menuList: document.getElementById('menu-list'),
		language: document.getElementById('language'),
		triggerRecorder: document.getElementById('trigger-recorder'),
		triggerDisplay: document.getElementById('trigger-display'),
		theme: document.getElementById('theme'),
		popupTheme: document.getElementById('popupTheme'),
		popupBlur: document.getElementById('popupBlur'),
		nativeMode: document.getElementById('nativeMode'),
		hijackNewTab: document.getElementById('hijackNewTab'),
		utmCleaner: document.getElementById('utmCleaner'),
		utmParams: document.getElementById('utmParams'),
		maliciousBlocker: document.getElementById('maliciousBlocker'),
		blocklist: document.getElementById('blocklist'),
		addPluginBtn: document.getElementById('add-plugin-btn'),
		importPluginBtn: document.getElementById('import-plugin-btn'),
		importPluginInput: document.getElementById('import-plugin-input'),
		pluginModal: document.getElementById('plugin-modal'),
		pluginForm: document.getElementById('plugin-form'),
		closePluginModal: document.getElementById('close-plugin-modal'),
	};

	const updateIndicator = () => {
		const activeLink = document.querySelector('.sidebar-menu a.is-active');
		if (activeLink && elements.navIndicator) {
			const indicatorHeight = 32;
			elements.navIndicator.style.height = `${indicatorHeight}px`;
			// Use offsetTop relative to menu-list
			elements.navIndicator.style.top = `${activeLink.offsetTop + (activeLink.offsetHeight - indicatorHeight) / 2}px`;
		}
	};

	let labelTimer = null;
	const setSidebarState = (state) => {
		elements.sidebar.classList.remove('is-collapsed', 'is-label-mode', 'is-active');
		elements.edgeTrigger.classList.remove('is-visible');

		if (state === 'collapsed') {
			elements.sidebar.classList.add('is-collapsed');
		} else if (state === 'label') {
			elements.sidebar.classList.add('is-label-mode');
			elements.edgeTrigger.classList.add('is-visible');
		}

		saveSettings({ sidebarState: state });
		updateTriggerArrow();
		setTimeout(updateIndicator, 300);
	};

	const resetLabelTimer = () => {
		if (currentSettings.sidebarState !== 'label') return;
		clearTimeout(labelTimer);
		elements.edgeTrigger.classList.remove('is-minimized');
		labelTimer = setTimeout(() => {
			if (!elements.sidebar.classList.contains('is-active')) {
				elements.edgeTrigger.classList.add('is-minimized');
			}
		}, 3000);
	};

	const updateTriggerArrow = () => {
		const isActive = elements.sidebar.classList.contains('is-active');
		const arrow = document.getElementById('trigger-arrow');
		if (!arrow) return;

		// Left Sidebar: Closed = Arrow Right (>), Open = Arrow Left (<)
		let rotation = isActive ? 180 : 0;
		arrow.style.transform = `rotate(${rotation}deg)`;

		// Update edge trigger position for Left Sidebar (Static push)
		if (currentSettings.sidebarState === 'label') {
			elements.edgeTrigger.style.left = isActive ? '280px' : '0';
		} else {
			elements.edgeTrigger.style.left = '';
		}
	};

	const formatTrigger = (t) => {
		const parts = [];
		if (t.ctrl) parts.push('Ctrl');
		if (t.shift) parts.push('Shift');
		if (t.alt) parts.push('Alt');
		if (t.meta) parts.push('Meta');
		parts.push('Click');
		return parts.join(' + ');
	};

	loadSettings(async (settings) => {
		await loadTranslations(settings.language);
		applyPanelTheme(settings.theme);

		// 1. Sync all values to hidden native elements
		elements.language.value = settings.language;
		elements.triggerDisplay.textContent = formatTrigger(settings.triggerKey);
		elements.theme.value = settings.theme;
		elements.popupTheme.value = settings.popupTheme;
		elements.popupBlur.value = settings.popupBlur;
		elements.nativeMode.checked = settings.nativeMode;
		elements.hijackNewTab.checked = settings.hijackNewTab;
		elements.utmCleaner.checked = settings.utmCleaner;
		elements.utmParams.value = settings.utmParams;
		elements.maliciousBlocker.checked = settings.maliciousBlocker;
		elements.blocklist.value = settings.blocklist;

		// 2. Sync custom selects display text
		document.querySelectorAll('.custom-select select').forEach((s) => {
			s.dispatchEvent(new Event('change'));
		});

		// 3. Handle Routing & Sidebar State BEFORE showing body
		const hash = window.location.hash.slice(1) || 'general-section';
		document.querySelectorAll('.content-section').forEach((s) => s.classList.toggle('is-active', s.id === hash));
		document.querySelectorAll('.sidebar-menu a').forEach((a) => a.classList.toggle('is-active', a.dataset.target === hash));

		setSidebarState(settings.sidebarState);
		renderPlugins(settings.plugins);

		// 4. Finalize UI and enable transitions
		setTimeout(() => {
			updateIndicator();
			document.body.classList.remove('no-transition');
			document.body.classList.add('is-animating', 'is-ready');

			// Stage 3: Remove Splash (Cognitive Loading End)
			const splash = document.getElementById('splash-screen');
			if (splash) {
				splash.classList.add('is-hidden');
				setTimeout(() => splash.remove(), 600);
			}
		}, 100);
	});

	// --- WHEEL PICKER SELECT LOGIC - v4 (5 Blocks & Dynamic Selection) ---
	const initCustomSelect = (containerId, selectId) => {
		const container = document.getElementById(containerId);
		const select = document.getElementById(selectId);
		const trigger = container.querySelector('.select-trigger');
		const valueSpan = container.querySelector('.select-value');
		const optionsContainer = container.querySelector('.select-options');
		const wheel = container.querySelector('.wheel-container');
		const overlay = container.querySelector('.wheel-overlay');
		const isInfinite = container.dataset.infinite === 'true';

		let wheelList = null;
		let highlight = null;
		let pool = []; // [Syntax] ? Virtual DOM Pool
		let virtualIndex = 0;
		let activeBlock = 3;
		let lastWheel = 0;
		const POOL_SIZE = 9; // [Syntax] ? Increased for high-speed stability
		const WHEEL_COOLDOWN = 50; // [Syntax] ? Cooldown in ms

		const buildWheel = () => {
			wheel.innerHTML = '<div class="wheel-highlight"></div><div class="wheel-list"></div>';
			wheelList = wheel.querySelector('.wheel-list');
			highlight = wheel.querySelector('.wheel-highlight');

			pool = [];
			for (let i = 0; i < POOL_SIZE; i++) {
				const el = document.createElement('div');
				el.className = 'option';
				el.innerHTML = '<span class="option-text"></span>';
				wheelList.appendChild(el);
				pool.push(el);
			}
		};

		const updateDisplay = () => {
			const selected = Array.from(select.options).find((o) => o.value === select.value);
			if (selected) valueSpan.textContent = `> [${selected.textContent}] <`;
		};

		let rafId = null;
		const renderVirtual = (animate = true) => {
			if (rafId) cancelAnimationFrame(rafId);

			rafId = requestAnimationFrame(() => {
				const data = Array.from(select.options);
				const count = data.length;
				const highlightTop = (activeBlock - 2) * 40 + 20;

				// [Syntax] ? Update Highlight & Overlay
				highlight.style.top = `${highlightTop}px`;
				highlight.style.transition = animate ? 'top 0.4s cubic-bezier(0.15, 1, 0.3, 1)' : 'none';
				overlay.style.setProperty('--highlight-top', `${highlightTop}px`);

				if (!isInfinite) {
					overlay.classList.toggle('is-limit-top', virtualIndex === 0);
					overlay.classList.toggle('is-limit-bottom', virtualIndex === count - 1);
				}

				// [Syntax] ? Virtual Positioning & Content Recycling
				const centerOffset = virtualIndex * 40;
				wheelList.style.transition = animate ? 'transform 0.4s cubic-bezier(0.15, 1, 0.3, 1)' : 'none';
				// ? Precision alignment for virtual list
				wheelList.style.transform = `translateY(${(highlightTop - centerOffset).toFixed(2)}px)`;

				pool.forEach((el, i) => {
					const poolOffset = i - Math.floor(POOL_SIZE / 2);
					const itemVirtualIdx = virtualIndex + poolOffset;

					let dataIdx = itemVirtualIdx;
					let isVisible = true;

					if (isInfinite) {
						dataIdx = ((itemVirtualIdx % count) + count) % count;
					} else {
						if (dataIdx < 0 || dataIdx >= count) isVisible = false;
					}

					if (isVisible) {
						const item = data[dataIdx];
						el.style.display = 'flex';

						// [Syntax] ? 3D Password Lock Visuals
						const dist = itemVirtualIdx - virtualIndex;
						const rotateX = dist * -25; // ? Cylinder rotation
						const absDist = Math.abs(dist);
						const opacity = Math.max(0, 1 - absDist * 0.35);
						const scale = Math.max(0.8, 1 - absDist * 0.05);
						const z = -absDist * 20; // ? Depth offset

						el.style.transform = `translateY(${itemVirtualIdx * 40}px) rotateX(${rotateX}deg) scale(${scale}) translateZ(${z}px)`;
						el.style.opacity = opacity;

						el.dataset.value = item.value;
						el.classList.toggle('is-selected', itemVirtualIdx === virtualIndex);

						const text = el.querySelector('.option-text');
						if (text.textContent !== item.textContent) {
							text.textContent = item.textContent;
							el.classList.remove('is-long');
							if (text.scrollWidth > 180) {
								el.classList.add('is-long');
								text.style.animationDuration = `${text.scrollWidth / 40}s`;
							}
						}
					} else {
						el.style.display = 'none';
					}
				});

				const realIdx = isInfinite ? ((virtualIndex % count) + count) % count : virtualIndex;
				const newValue = data[realIdx].value;
				if (select.value !== newValue) {
					select.value = newValue;
					select.dispatchEvent(new Event('change'));
				}
			});
		};

		const setIndex = (index, animate = true) => {
			const count = select.options.length;
			index = Math.round(index); // ? Ensure integer indexing
			if (!isInfinite) {
				index = Math.max(0, Math.min(count - 1, index));
			}
			virtualIndex = index;
			renderVirtual(animate);
		};

		trigger.addEventListener('click', (e) => {
			e.stopPropagation();
			const isOpen = container.classList.contains('is-open');
			document.querySelectorAll('.custom-select').forEach((s) => s.classList.remove('is-open'));

			if (!isOpen) {
				// [Syntax] ? Embedded mode uses fixed center selection (Block 3)
				activeBlock = 3;

				if (!wheelList) buildWheel();
				container.classList.add('is-open');

				const rawIdx = Array.from(select.options).findIndex((o) => o.value === select.value);
				setIndex(rawIdx, false);
			}
		});

		optionsContainer.addEventListener(
			'wheel',
			(e) => {
				e.preventDefault();
				const now = performance.now();
				if (now - lastWheel < WHEEL_COOLDOWN) return;

				if (Math.abs(e.deltaY) < 5) return;
				lastWheel = now;
				const direction = e.deltaY > 0 ? 1 : -1;
				setIndex(virtualIndex + direction);
			},
			{ passive: false },
		);

		wheel.addEventListener('click', (e) => {
			const opt = e.target.closest('.option');
			if (opt) {
				// [Syntax] ? Calculate virtual index from clicked element's transform
				const transform = opt.style.transform;
				const match = transform.match(/translateY\((-?\d+)px\)/);
				if (match) {
					const y = parseInt(match[1]);
					setIndex(Math.round(y / 40));
					setTimeout(() => container.classList.remove('is-open'), 200);
				}
			}
		});

		select.addEventListener('change', updateDisplay);
		updateDisplay();
	};

	// --- LISTENERS ---
	document.addEventListener('click', () => {
		document.querySelectorAll('.custom-select').forEach((s) => s.classList.remove('is-open'));
	});

	initCustomSelect('language-select', 'language');
	initCustomSelect('theme-select', 'theme');
	initCustomSelect('popupTheme-select', 'popupTheme');

	elements.sidebarToggle.addEventListener('click', (e) => {
		e.stopPropagation();
		const isActive = elements.sidebar.classList.contains('is-active');

		if (currentSettings.sidebarState === 'label') {
			elements.sidebar.classList.toggle('is-active');
			updateTriggerArrow();
		} else {
			const states = ['expanded', 'collapsed', 'label'];
			const next = states[(states.indexOf(currentSettings.sidebarState) + 1) % states.length];
			setSidebarState(next);
		}
	});

	// Logo Icon Click to toggle between Expanded and Collapsed (if space allows)
	elements.sidebarLabel.addEventListener('click', (e) => {
		e.stopPropagation();
		const next = currentSettings.sidebarState === 'expanded' ? 'collapsed' : 'expanded';
		setSidebarState(next);
	});

	elements.edgeTrigger.addEventListener('mouseenter', () => {
		if (currentSettings.sidebarState === 'label' && !elements.sidebar.classList.contains('is-active')) {
			elements.sidebar.classList.add('is-peek');
			document.querySelector('.content-area').style.marginLeft = '72px';
		}
	});

	elements.edgeTrigger.addEventListener('mouseleave', () => {
		if (currentSettings.sidebarState === 'label' && !elements.sidebar.classList.contains('is-active')) {
			elements.sidebar.classList.remove('is-peek');
			document.querySelector('.content-area').style.marginLeft = '0';
			document.querySelector('.content-area').style.marginRight = '0';
		}
	});

	elements.edgeTrigger.addEventListener('click', (e) => {
		e.stopPropagation();
		const isActive = elements.sidebar.classList.toggle('is-active');
		if (isActive) {
			elements.sidebar.classList.remove('is-peek');
			document.querySelector('.content-area').style.marginLeft = '0';
			document.querySelector('.content-area').style.marginRight = '0';
		}
		updateTriggerArrow();
	});

	document.addEventListener('click', (e) => {
		if (elements.sidebar.classList.contains('is-active') && !elements.sidebar.contains(e.target) && !elements.edgeTrigger.contains(e.target)) {
			elements.sidebar.classList.remove('is-active');
			updateTriggerArrow();
		}
	});

	// Clicking icons in collapsed mode should NOT expand the sidebar automatically
	// Removed the auto-expand listener to maintain collapsed state when switching sections

	window.addEventListener('resize', () => {
		setSidebarState(currentSettings.sidebarState);
	});

	// Trigger Recorder - Deterministic State Machine
	let isRecording = false;
	let recordLock = false;

	const startRecording = () => {
		if (isRecording || recordLock) return;
		isRecording = true;
		elements.triggerRecorder.classList.add('is-recording');
		elements.triggerDisplay.textContent = 'Press keys + Click here...';

		// Use capture phase to intercept and deterministic logic
		window.addEventListener('mousedown', onRecordAttempt, true);
	};

	const stopRecording = (newKey = null) => {
		isRecording = false;
		recordLock = true;
		elements.triggerRecorder.classList.remove('is-recording');

		if (newKey) {
			saveSettings({ triggerKey: newKey });
			elements.triggerDisplay.textContent = formatTrigger(newKey);
		} else {
			elements.triggerDisplay.textContent = formatTrigger(currentSettings.triggerKey);
		}

		window.removeEventListener('mousedown', onRecordAttempt, true);

		// Prevent immediate re-triggering from the same click sequence
		setTimeout(() => {
			recordLock = false;
		}, 200);
	};

	const onRecordAttempt = (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		// Only stop and save if clicking the recorder box
		if (elements.triggerRecorder.contains(ev.target)) {
			const newKey = {
				ctrl: ev.ctrlKey,
				shift: ev.shiftKey,
				alt: ev.altKey,
				meta: ev.metaKey,
			};
			stopRecording(newKey);
		}
	};

	elements.triggerRecorder.addEventListener('mousedown', (e) => {
		e.stopPropagation();
		if (!isRecording && !recordLock) {
			startRecording();
		}
	});

	elements.language.addEventListener('change', (e) => saveSettings({ language: e.target.value }));
	elements.theme.addEventListener('change', (e) => {
		saveSettings({ theme: e.target.value });
		applyPanelTheme(e.target.value);
	});
	elements.popupTheme.addEventListener('change', (e) => saveSettings({ popupTheme: e.target.value }));
	elements.popupBlur.addEventListener('input', (e) => saveSettings({ popupBlur: parseInt(e.target.value) }));
	elements.nativeMode.addEventListener('change', (e) => saveSettings({ nativeMode: e.target.checked }));
	elements.hijackNewTab.addEventListener('change', (e) => saveSettings({ hijackNewTab: e.target.checked }));
	elements.utmCleaner.addEventListener('change', (e) => saveSettings({ utmCleaner: e.target.checked }));
	elements.utmParams.addEventListener('change', (e) => saveSettings({ utmParams: e.target.value }));
	elements.maliciousBlocker.addEventListener('change', (e) => saveSettings({ maliciousBlocker: e.target.checked }));
	elements.blocklist.addEventListener('change', (e) => saveSettings({ blocklist: e.target.value }));

	// Indicator Dragging
	let isDragging = false;
	elements.navIndicator.addEventListener('mousedown', (e) => {
		e.preventDefault();
		isDragging = true;
	});
	document.addEventListener('mousemove', (e) => {
		if (!isDragging) return;
		const rect = elements.menuList.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const links = Array.from(document.querySelectorAll('.sidebar-menu a'));
		const targetLink = links.find((link) => y >= link.offsetTop && y <= link.offsetTop + link.offsetHeight);
		if (targetLink && !targetLink.classList.contains('is-active')) {
			targetLink.click();
		}
	});
	document.addEventListener('mouseup', () => {
		isDragging = false;
	});

	// Plugin Modal
	const showPluginModal = (plugin = null) => {
		elements.pluginModal.style.display = 'flex';
		if (plugin) {
			document.getElementById('plugin-id').value = plugin.id;
			document.getElementById('plugin-name').value = plugin.name;
			document.getElementById('plugin-matches').value = plugin.matches[0];
			document.getElementById('plugin-embed').value = plugin.rules?.embedUrl || '';
			document.getElementById('plugin-idregex').value = plugin.rules?.idRegex || '';
			document.getElementById('plugin-modal-title').textContent = 'Edit Plugin';
		} else {
			elements.pluginForm.reset();
			document.getElementById('plugin-id').value = '';
			document.getElementById('plugin-modal-title').textContent = 'Add Plugin';
		}
	};

	elements.addPluginBtn.addEventListener('click', () => showPluginModal());
	elements.closePluginModal.addEventListener('click', () => {
		elements.pluginModal.style.display = 'none';
	});

	elements.pluginForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const id = document.getElementById('plugin-id').value || `plugin_${Date.now()}`;
		const plugin = {
			id,
			name: document.getElementById('plugin-name').value,
			matches: [document.getElementById('plugin-matches').value],
			rules: {
				embedUrl: document.getElementById('plugin-embed').value,
				idRegex: document.getElementById('plugin-idregex').value,
			},
		};
		const plugins = currentSettings.plugins ? [...currentSettings.plugins] : [];
		const idx = plugins.findIndex((p) => p.id === id);
		if (idx > -1) plugins[idx] = plugin;
		else plugins.push(plugin);
		saveSettings({ plugins });
		renderPlugins(plugins);
		elements.pluginModal.style.display = 'none';
	});

	elements.contentArea = document.querySelector('.content-area');
	elements.contentArea.addEventListener('click', (e) => {
		const del = e.target.closest('.delete-plugin-btn');
		const edit = e.target.closest('.edit-plugin-btn');
		if (del) {
			const plugins = currentSettings.plugins.filter((_, i) => i != del.dataset.index);
			saveSettings({ plugins });
			renderPlugins(plugins);
		}
		if (edit) {
			showPluginModal(currentSettings.plugins[edit.dataset.index]);
		}
	});

	elements.importPluginBtn.addEventListener('click', () => elements.importPluginInput.click());
	elements.importPluginInput.addEventListener('change', (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const plugin = JSON.parse(ev.target.result);
				const plugins = currentSettings.plugins ? [...currentSettings.plugins, plugin] : [plugin];
				saveSettings({ plugins });
				renderPlugins(plugins);
			} catch (err) {
				alert('Invalid JSON');
			}
		};
		reader.readAsText(file);
	});

	// Navigation
	const handleRouting = () => {
		const hash = window.location.hash.slice(1) || 'general-section';
		document.querySelectorAll('.content-section').forEach((s) => s.classList.toggle('is-active', s.id === hash));
		document.querySelectorAll('.sidebar-menu a').forEach((a) => a.classList.toggle('is-active', a.dataset.target === hash));
		updateIndicator();
	};
	window.addEventListener('hashchange', handleRouting);
	document.querySelectorAll('.sidebar-menu a').forEach((a) =>
		a.addEventListener('click', (e) => {
			e.preventDefault();
			window.location.hash = a.dataset.target;
		}),
	);
	handleRouting();
});
