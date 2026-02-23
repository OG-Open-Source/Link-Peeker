/**
 * @file content.js v5.2.0-1
 * @description Content script for the Link Peeker extension.
 */

const defaultSettings = {
	triggerKey: { ctrl: false, shift: false, alt: true, meta: false },
	theme: 'auto',
	popupTheme: 'auto',
	popupBlur: 4,
	nativeMode: false,
	hijackNewTab: false,
	utmCleaner: true,
	utmParams: 'utm_source, utm_medium, utm_campaign, fbclid, gclid',
	maliciousBlocker: false,
	blocklist: '',
	referrerPolicy: 'strict-origin-when-cross-origin',
	sandbox: {
		'allow-forms': true,
		'allow-modals': true,
		'allow-orientation-lock': true,
		'allow-pointer-lock': true,
		'allow-popups': true,
		'allow-popups-to-escape-sandbox': true,
		'allow-presentation': true,
		'allow-same-origin': true,
		'allow-scripts': true,
		'allow-top-navigation': true,
		'allow-top-navigation-by-user-activation': true,
		'allow-downloads': true,
		'allow-storage-access-by-user-activation': true,
	},
	allow: {
		'autoplay': true,
		'camera': false,
		'clipboard-write': false,
		'display-capture': false,
		'encrypted-media': true,
		'fullscreen': true,
		'geolocation': false,
		'microphone': false,
		'payment': false,
		'screen-wake-lock': false,
		'web-share': true,
	},
};

let settings = { ...defaultSettings };

// Load settings initially
chrome.storage.sync.get(defaultSettings, (loadedSettings) => {
	settings = loadedSettings;
	initPreview();
	setupInterceptors();
});

chrome.storage.onChanged.addListener((changes) => {
	for (let [key, { newValue }] of Object.entries(changes)) {
		settings[key] = newValue;
	}
});

let previewHost = null;
let previewWindow = null;

function initPreview() {
	if (document.getElementById('link-peeker-host')) return;

	previewHost = document.createElement('div');
	previewHost.id = 'link-peeker-host';
	Object.assign(previewHost.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100vw',
		height: '100vh',
		zIndex: '2147483647',
		opacity: '0',
		visibility: 'hidden',
		transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'transparent',
	});

	const shadowRoot = previewHost.attachShadow({ mode: 'open' });
	previewWindow = shadowRoot;
	shadowRoot.innerHTML = `
	 <style>
	   :host {
	     --bg: #ffffff;
	     --fg: #111827;
	     --border: #e5e7eb;
	     --radius: 16px;
	     --blur: 4px;
	   }
	   :host([theme="dark"]) { --bg: #121212; --fg: #eeeeee; --border: #2a2a2a; }
	   :host([theme="light"]) { --bg: #ffffff; --fg: #111827; --border: #e5e7eb; }
	   
	   @media (prefers-color-scheme: dark) {
	     :host([theme="auto"]) { --bg: #121212; --fg: #eeeeee; --border: #2a2a2a; }
	   }

	   .box {
	     width: 92vw;
	     height: 88vh;
	     background: var(--bg);
	     border: 1px solid var(--border);
	     border-radius: var(--radius);
	     box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.4);
	     display: flex;
	     flex-direction: column;
	     overflow: hidden;
	     position: relative;
	     transform: scale(0.96);
	     transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	     backdrop-filter: blur(var(--blur));
	     -webkit-backdrop-filter: blur(var(--blur));
	     pointer-events: auto;
	   }
	   :host([visible]) .box { transform: scale(1); }
	   
	   .header {
	     padding: 1rem 1.5rem;
	     border-bottom: 1px solid var(--border);
	     display: flex;
	     justify-content: space-between;
	     align-items: center;
	     background: var(--bg);
	     cursor: default;
	   }
	   .url-text {
	     font-size: 0.9rem;
	     font-weight: 500;
	     color: var(--fg);
	     opacity: 0.7;
	     white-space: nowrap;
	     overflow: hidden;
	     text-overflow: ellipsis;
	     max-width: 70%;
	     font-family: monospace;
	   }
	   .controls { display: flex; gap: 0.75rem; }
	   .btn {
	     padding: 0.6rem;
	     border-radius: 8px;
	     border: 1px solid var(--border);
	     background: transparent;
	     color: var(--fg);
	     cursor: pointer;
	     display: flex;
	     align-items: center;
	     justify-content: center;
	     transition: all 0.2s;
	   }
	   .btn:hover { background: rgba(128,128,128,0.1); transform: translateY(-1px); }
	   .btn svg { width: 20px; height: 20px; }
	   
	   .iframe-container { flex: 1; position: relative; background: #fff; }
	   iframe { width: 100%; height: 100%; border: none; }
	   
	   .loader-overlay {
	     position: absolute;
	     inset: 0;
	     background: var(--bg);
	     display: flex;
	     flex-direction: column;
	     align-items: center;
	     justify-content: center;
	     z-index: 10;
	     transition: opacity 0.3s;
	   }
	   .spinner {
	     width: 50px;
	     height: 50px;
	     border: 4px solid var(--border);
	     border-top-color: var(--fg);
	     border-radius: 50%;
	     animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	   }
	   @keyframes spin { to { transform: rotate(360deg); } }
	   .status-text { margin-top: 1.5rem; font-size: 1rem; font-weight: 600; color: var(--fg); font-family: sans-serif; }
	 </style>
	 <div class="box">
	   <div class="header">
	     <div id="url-display" class="url-text"></div>
	     <div class="controls">
	       <button id="btn-open" class="btn" title="Open in new tab">
	         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
	       </button>
	       <button id="btn-close" class="btn" title="Close">
	         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
	       </button>
	     </div>
	   </div>
	   <div class="iframe-container">
	     <div id="loader" class="loader-overlay">
	       <div class="spinner"></div>
	       <div class="status-text">Loading Preview...</div>
	     </div>
	     <iframe id="preview-iframe"></iframe>
	   </div>
	 </div>
	`;
	document.body.appendChild(previewHost);

	previewWindow.getElementById('btn-close').addEventListener('click', (e) => {
		e.stopPropagation();
		closePreview();
	});

	previewWindow.querySelector('.header').addEventListener('click', (e) => {
		e.stopPropagation();
	});

	previewHost.addEventListener('click', (e) => {
		if (e.target === previewHost) closePreview();
	});
}

function openPreview(url) {
	if (!previewHost) initPreview();

	const cleanUrl = cleanUTM(url);

	// Malicious Check
	if (settings.maliciousBlocker && settings.blocklist) {
		const lines = settings.blocklist
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l);
		const isBlocked = lines.some((pattern) => {
			try {
				const regex = new RegExp(`^https?://${pattern}`, 'i');
				return regex.test(cleanUrl);
			} catch (e) {
				return false;
			}
		});

		if (isBlocked) {
			alert('Link Peeker: This URL is blocked by your security settings.');
			return;
		}
	}

	previewHost.setAttribute('theme', settings.popupTheme || 'auto');
	previewHost.style.setProperty('--blur', `${settings.popupBlur || 0}px`);

	const iframe = previewWindow.getElementById('preview-iframe');
	const loader = previewWindow.getElementById('loader');
	const urlDisplay = previewWindow.getElementById('url-display');

	urlDisplay.textContent = cleanUrl;
	loader.style.opacity = '1';
	loader.style.display = 'flex';

	iframe.src = cleanUrl;

	previewHost.style.visibility = 'visible';
	previewHost.style.opacity = '1';
	previewHost.style.pointerEvents = 'auto';
	previewHost.setAttribute('visible', '');

	iframe.onload = () => {
		loader.style.opacity = '0';
		setTimeout(() => {
			loader.style.display = 'none';
		}, 300);
	};

	previewWindow.getElementById('btn-open').onclick = () => {
		window.open(cleanUrl, '_blank');
		closePreview();
	};
}

function closePreview() {
	previewHost.style.opacity = '0';
	previewHost.style.pointerEvents = 'none';
	previewHost.removeAttribute('visible');
	setTimeout(() => {
		previewHost.style.visibility = 'hidden';
		previewWindow.getElementById('preview-iframe').src = 'about:blank';
	}, 300);
}

function cleanUTM(url) {
	if (!settings.utmCleaner || !settings.utmParams) return url;
	try {
		const u = new URL(url);
		const params = u.searchParams;
		const cleanList = settings.utmParams
			.split(',')
			.map((p) => p.trim())
			.filter((p) => p);
		cleanList.forEach((k) => params.delete(k));
		return u.toString();
	} catch (e) {
		return url;
	}
}

function setupInterceptors() {
	document.addEventListener(
		'click',
		(e) => {
			const link = e.target.closest('a');
			if (!link || !link.href || !link.href.startsWith('http')) return;

			const t = settings.triggerKey;
			const isTriggered = t.ctrl === e.ctrlKey && t.shift === e.shiftKey && t.alt === e.altKey && t.meta === e.metaKey;
			const isNewTab = link.target === '_blank' || e.ctrlKey || e.metaKey;

			let shouldIntercept = false;

			if (settings.nativeMode) {
				shouldIntercept = true;
			} else if (isTriggered) {
				shouldIntercept = true;
			} else if (settings.hijackNewTab && isNewTab) {
				shouldIntercept = true;
			}

			if (shouldIntercept) {
				e.preventDefault();
				e.stopPropagation();
				openPreview(link.href);
			}
		},
		true,
	);
}
