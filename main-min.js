const REFERRER_POLICIES = ['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url'],
	defaultSettings = {
		triggerKey: 'Alt',
		theme: 'dark',
		blurAmount: 5,
		referrerPolicy: 'strict-origin-when-cross-origin',
		customThemes: {},
		customRules: [
			{ domain: '*.youtube.com', headersToRemove: ['X-Frame-Options', 'Content-Security-Policy'] },
			{ domain: 'youtu.be', headersToRemove: ['X-Frame-Options', 'Content-Security-Policy'] },
			{ domain: 'github.com', headersToRemove: ['Content-Security-Policy'] },
		],
		sandbox: { 'allow-forms': !0, 'allow-modals': !0, 'allow-orientation-lock': !1, 'allow-pointer-lock': !1, 'allow-popups': !0, 'allow-popups-to-escape-sandbox': !1, 'allow-presentation': !0, 'allow-same-origin': !0, 'allow-scripts': !0, 'allow-top-navigation': !1, 'allow-top-navigation-by-user-activation': !0, 'allow-downloads': !0, 'allow-downloads-without-user-activation': !1, 'allow-storage-access-by-user-activation': !0 },
		allow: { 'autoplay': !0, 'camera': !1, 'clipboard-write': !1, 'display-capture': !1, 'encrypted-media': !0, 'fullscreen': !0, 'geolocation': !1, 'microphone': !1, 'payment': !1, 'screen-wake-lock': !1, 'web-share': !0 },
	};
let currentSettings = {};
const BUILT_IN_THEMES = { light: { name: chrome.i18n.getMessage('themeLight') || 'Light', blurEnabled: !0, blurAmount: 10, boxBg: 'rgba(255, 255, 255, 0.75)', border: '#d1d1d1', buttonBg: 'rgba(245, 245, 245, 0.7)', buttonHoverBg: 'rgba(235, 235, 235, 0.9)', primaryTextColor: '#222222', secondaryTextColor: '#555555', errorColor: '#d32f2f' }, dark: { name: chrome.i18n.getMessage('themeDark') || 'Dark', blurEnabled: !0, blurAmount: 10, boxBg: 'rgba(30, 30, 30, 0.75)', border: '#424242', buttonBg: 'rgba(45, 45, 45, 0.7)', buttonHoverBg: 'rgba(60, 60, 60, 0.9)', primaryTextColor: '#f5f5f5', secondaryTextColor: '#bbbbbb', errorColor: '#ff5252' } };
function saveSettings(e) {
	chrome.storage.sync.set(e, () => {});
}
function loadSettings(e) {
	chrome.storage.sync.get(defaultSettings, (t) => {
		((currentSettings = t), e && e(t));
	});
}
function applyTranslations() {
	(document.querySelectorAll('[data-i18n]').forEach((e) => {
		const t = e.dataset.i18n,
			n = chrome.i18n.getMessage(t);
		n && ('INPUT' === e.tagName && 'submit' === e.type ? (e.value = n) : (e.textContent = n));
	}),
		(document.title = chrome.i18n.getMessage('settingsTitle')));
}
function createPolicyOption(e, t, n, o) {
	const a = document.createElement('label');
	a.className = e;
	const r = document.createElement('input');
	((r.type = e), (r.dataset.key = t), 'radio' === e && ((r.name = 'referrer'), (r.value = t)));
	const l = document.createElement('span');
	((l.className = 'icon-wrapper'), 'checkbox' === e ? (l.innerHTML = '<i data-lucide="square" class="unchecked-icon"></i><i data-lucide="check-square" class="checked-icon"></i>') : 'radio' === e && (l.innerHTML = '<i data-lucide="circle" class="unchecked-icon"></i><i data-lucide="check-circle" class="checked-icon"></i>'));
	const s = document.createElement('span');
	s.className = 'option-text';
	const i = chrome.i18n.getMessage(n) || n;
	((s.textContent = `${i} (${t})`), a.appendChild(r), a.appendChild(l), a.appendChild(s), o.appendChild(a));
}
function applyPanelTheme(e) {
	const t = 'light' === e || 'dark' === e ? e : 'light';
	document.documentElement.setAttribute('data-theme', t);
}
async function loadAllThemes() {
	const { customThemes: e } = await chrome.storage.local.get({ customThemes: {} });
	return { ...BUILT_IN_THEMES, ...e };
}
function populateThemeDropdown(e, t) {
	const n = document.getElementById('theme');
	n.innerHTML = '';
	const o = document.createElement('option');
	((o.value = 'light'), (o.textContent = e.light.name || 'Light'), n.appendChild(o));
	const a = document.createElement('option');
	((a.value = 'dark'), (a.textContent = e.dark.name || 'Dark'), n.appendChild(a));
	const r = Object.keys(e).filter((e) => 'light' !== e && 'dark' !== e);
	if (r.length > 0) {
		const t = document.createElement('option');
		((t.disabled = !0),
			(t.textContent = '──────────'),
			n.appendChild(t),
			r.forEach((t) => {
				const o = document.createElement('option');
				((o.value = t), (o.textContent = e[t].name || t), n.appendChild(o));
			}));
	}
	n.value = t;
}
async function saveCustomTheme(e, t) {
	const { customThemes: n } = await chrome.storage.local.get({ customThemes: {} });
	((n[e] = t), await chrome.storage.local.set({ customThemes: n }));
}
async function deleteCustomTheme(e) {
	const { customThemes: t } = await chrome.storage.local.get({ customThemes: {} });
	(delete t[e], await chrome.storage.local.set({ customThemes: t }));
}
document.addEventListener('DOMContentLoaded', () => {
	const e = { triggerKey: document.getElementById('triggerKey'), theme: document.getElementById('theme'), sandboxOptions: document.getElementById('sandbox-options'), allowOptions: document.getElementById('allow-options'), referrerPolicyOptions: document.getElementById('referrer-policy-options'), addThemeBtn: document.getElementById('add-theme-btn'), themeEditor: document.getElementById('theme-editor'), themeIdInput: document.getElementById('theme-id-input'), themeNameInput: document.getElementById('theme-name-input'), themeBlurEnabledInput: document.getElementById('theme-blurEnabled-input'), themeBlurAmountInput: document.getElementById('theme-blurAmount-input'), themeBoxBgInput: document.getElementById('theme-boxBg-input'), themeBorderInput: document.getElementById('theme-border-input'), themeButtonBgInput: document.getElementById('theme-buttonBg-input'), themeButtonHoverBgInput: document.getElementById('theme-buttonHoverBg-input'), themePrimaryTextColorInput: document.getElementById('theme-primaryTextColor-input'), themeSecondaryTextColorInput: document.getElementById('theme-secondaryTextColor-input'), themeErrorColorInput: document.getElementById('theme-errorColor-input'), saveThemeBtn: document.getElementById('save-theme-btn'), cancelEditBtn: document.getElementById('cancel-edit-btn'), importThemeBtn: document.getElementById('import-theme-btn'), importThemeInput: document.getElementById('import-theme-input'), exportThemeBtn: document.getElementById('export-theme-btn'), deleteThemeBtn: document.getElementById('delete-theme-btn'), addRuleForm: document.getElementById('add-rule-form'), ruleDomainInput: document.getElementById('rule-domain-input'), ruleRemoveCsp: document.getElementById('rule-remove-csp'), ruleRemoveXfo: document.getElementById('rule-remove-xfo'), customRulesTableBody: document.getElementById('custom-rules-table-body'), ruleIndexInput: document.getElementById('rule-index-input') };
	let t = {};
	(applyTranslations(),
		loadSettings(async (n) => {
			(applyPanelTheme(n.theme),
				(e.triggerKey.value = n.triggerKey),
				(t = await loadAllThemes()),
				populateThemeDropdown(t, n.theme),
				Object.keys(defaultSettings.sandbox).forEach((t) => {
					createPolicyOption('checkbox', t, `sb_${t.replace(/-/g, '_')}`, e.sandboxOptions);
				}),
				Object.keys(defaultSettings.allow).forEach((t) => {
					createPolicyOption('checkbox', t, `fp_${t.replace(/-/g, '_')}`, e.allowOptions);
				}),
				REFERRER_POLICIES.forEach((t) => {
					createPolicyOption('radio', t, `rp_${t.replace(/-/g, '_')}`, e.referrerPolicyOptions);
				}),
				Object.keys(n.sandbox).forEach((t) => {
					const o = e.sandboxOptions.querySelector(`[data-key="${t}"]`);
					o && (o.checked = n.sandbox[t]);
				}),
				Object.keys(n.allow).forEach((t) => {
					const o = e.allowOptions.querySelector(`[data-key="${t}"]`);
					o && (o.checked = n.allow[t]);
				}));
			const a = e.referrerPolicyOptions.querySelector(`[value="${n.referrerPolicy}"]`);
			(a && (a.checked = !0), o(n.customRules || []), lucide.createIcons());
		}),
		e.triggerKey.addEventListener('change', (e) => saveSettings({ triggerKey: e.target.value })),
		e.theme.addEventListener('change', (t) => {
			const n = t.target.value;
			(saveSettings({ theme: n }), applyPanelTheme(n), 'light' !== n && 'dark' !== n ? (e.deleteThemeBtn.classList.remove('is-hidden'), e.exportThemeBtn.classList.remove('is-hidden')) : (e.deleteThemeBtn.classList.add('is-hidden'), e.exportThemeBtn.classList.add('is-hidden')));
		}));
	const n = () => {
		r(e.themeEditor, () => {
			(e.themeEditor.classList.add('is-hidden'), e.addThemeBtn.classList.remove('is-hidden'));
		});
	};
	function o(t) {
		if (((e.customRulesTableBody.innerHTML = ''), !t || 0 === t.length)) {
			const t = document.createElement('tr');
			return ((t.innerHTML = '<td colspan="3" class="has-text-centered" data-i18n="noCustomRules">No custom rules defined.</td>'), void e.customRulesTableBody.appendChild(t));
		}
		(t.forEach((t, n) => {
			const o = document.createElement('tr'),
				a = t.headersToRemove.join(', ');
			((o.innerHTML = `\n        <td>${t.domain}</td>\n        <td>${a}</td>\n        <td class="action-buttons">\n          <button class="button is-small edit-rule-btn" data-index="${n}" title="${chrome.i18n.getMessage('editRuleBtn')}">\n            <i data-lucide="square-pen"></i>\n          </button>\n          <button class="button is-danger is-small delete-rule-btn" data-index="${n}" title="${chrome.i18n.getMessage('deleteRuleBtn')}">\n            <i data-lucide="trash-2"></i>\n          </button>\n        </td>\n      `), e.customRulesTableBody.appendChild(o));
		}),
			lucide.createIcons(),
			applyTranslations());
	}
	async function a(e) {
		((currentSettings.customRules = e), await chrome.storage.sync.set({ customRules: e }), chrome.runtime.sendMessage({ action: 'updateRules', rules: e }), o(e));
	}
	function r(e, t) {
		((e.style.height = `${e.offsetHeight}px`),
			requestAnimationFrame(() => {
				e.animate(
					[
						{ height: `${e.offsetHeight}px`, opacity: 1 },
						{ height: '0px', opacity: 0 },
					],
					{ duration: 200, easing: 'ease-in-out' },
				).onfinish = t;
			}));
	}
	function l(e, t) {
		e.animate(
			[
				{ height: '0px', opacity: 0 },
				{ height: `${e.scrollHeight}px`, opacity: 1 },
			],
			{ duration: 200, easing: 'ease-in-out' },
		).onfinish = () => {
			((e.style.height = 'auto'), t && t());
		};
	}
	function s(e) {
		e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-in-out' });
	}
	(e.addThemeBtn.addEventListener('click', () =>
		((t = null) => {
			(t ? ((e.themeIdInput.value = t.id), (e.themeNameInput.value = t.name), (e.themeBlurEnabledInput.checked = t.blurEnabled), (e.themeBlurAmountInput.value = t.blurAmount), (e.themeBoxBgInput.value = t.boxBg), (e.themeBorderInput.value = t.border), (e.themeButtonBgInput.value = t.buttonBg), (e.themeButtonHoverBgInput.value = t.buttonHoverBg), (e.themePrimaryTextColorInput.value = t.primaryTextColor), (e.themeSecondaryTextColorInput.value = t.secondaryTextColor), (e.themeErrorColorInput.value = t.errorColor)) : (e.themeEditor.reset(), (e.themeIdInput.value = `custom_${Date.now()}`)), e.addThemeBtn.classList.add('is-hidden'), e.themeEditor.classList.remove('is-hidden'), l(e.themeEditor));
		})(),
	),
		e.cancelEditBtn.addEventListener('click', n),
		e.themeEditor.addEventListener('submit', async (o) => {
			o.preventDefault();
			const a = e.themeIdInput.value,
				r = { name: e.themeNameInput.value, blurEnabled: e.themeBlurEnabledInput.checked, blurAmount: parseInt(e.themeBlurAmountInput.value, 10), boxBg: e.themeBoxBgInput.value, border: e.themeBorderInput.value, buttonBg: e.themeButtonBgInput.value, buttonHoverBg: e.themeButtonHoverBgInput.value, primaryTextColor: e.themePrimaryTextColorInput.value, secondaryTextColor: e.themeSecondaryTextColorInput.value, errorColor: e.themeErrorColorInput.value };
			(await saveCustomTheme(a, r), (t = await loadAllThemes()), populateThemeDropdown(t, a), saveSettings({ theme: a }), applyPanelTheme(a), n());
		}),
		e.deleteThemeBtn.addEventListener('click', async () => {
			const n = e.theme.value;
			n && 'light' !== n && 'dark' !== n && confirm(`Are you sure you want to delete the theme "${t[n].name}"?`) && (await deleteCustomTheme(n), (t = await loadAllThemes()), populateThemeDropdown(t, 'dark'), saveSettings({ theme: 'dark' }), applyPanelTheme('dark'));
		}),
		e.importThemeBtn.addEventListener('click', () => e.importThemeInput.click()),
		e.importThemeInput.addEventListener('change', (n) => {
			const o = n.target.files[0];
			if (!o) return;
			const a = new FileReader();
			((a.onload = async (e) => {
				try {
					const n = JSON.parse(e.target.result);
					if (n.name && n.boxBg) {
						const e = `custom_${Date.now()}`;
						(await saveCustomTheme(e, n), (t = await loadAllThemes()), populateThemeDropdown(t, e), saveSettings({ theme: e }), applyPanelTheme(e), alert('Theme imported successfully!'));
					} else alert('Invalid theme file format.');
				} catch (e) {
					alert("Could not parse theme file. Make sure it's valid JSON.");
				}
			}),
				a.readAsText(o),
				(e.importThemeInput.value = ''));
		}),
		e.exportThemeBtn.addEventListener('click', () => {
			const n = e.theme.value;
			if (n && !['light', 'dark'].includes(n)) {
				const e = t[n],
					o = new Blob([JSON.stringify(e, null, 2)], { type: 'application/json' }),
					a = URL.createObjectURL(o),
					r = document.createElement('a');
				((r.href = a), (r.download = `${n}.json`), document.body.appendChild(r), r.click(), document.body.removeChild(r), URL.revokeObjectURL(a));
			}
		}),
		e.sandboxOptions.addEventListener('change', (e) => {
			if (e.target.matches('input[type="checkbox"]')) {
				const t = { ...currentSettings.sandbox, [e.target.dataset.key]: e.target.checked };
				((currentSettings.sandbox = t), saveSettings({ sandbox: t }));
			}
		}),
		e.allowOptions.addEventListener('change', (e) => {
			if (e.target.matches('input[type="checkbox"]')) {
				const t = { ...currentSettings.allow, [e.target.dataset.key]: e.target.checked };
				((currentSettings.allow = t), saveSettings({ allow: t }));
			}
		}),
		e.referrerPolicyOptions.addEventListener('change', (e) => {
			e.target.matches('input[type="radio"]') && saveSettings({ referrerPolicy: e.target.value });
		}),
		e.addRuleForm.addEventListener('submit', async (t) => {
			t.preventDefault();
			const n = e.ruleDomainInput.value.trim();
			if (!n) return;
			const o = [];
			if ((e.ruleRemoveCsp.checked && o.push('Content-Security-Policy'), e.ruleRemoveXfo.checked && o.push('X-Frame-Options'), 0 === o.length)) return void alert(chrome.i18n.getMessage('error_select_header') || 'Please select at least one header to remove.');
			const r = { domain: n, headersToRemove: o },
				l = currentSettings.customRules || [],
				s = parseInt(e.ruleIndexInput.value, 10);
			if (s > -1) ((l[s] = r), await a(l));
			else {
				if (l.some((e) => e.domain === n)) return void alert(chrome.i18n.getMessage('error_duplicate_rule') || 'A rule for this domain already exists.');
				const e = [...l, r];
				await a(e);
			}
			(e.addRuleForm.reset(), (e.ruleIndexInput.value = '-1'));
		}),
		e.customRulesTableBody.addEventListener('click', async (t) => {
			const n = t.target.closest('.edit-rule-btn'),
				o = t.target.closest('.delete-rule-btn');
			if (n) {
				const t = parseInt(n.dataset.index, 10),
					o = currentSettings.customRules[t];
				((e.ruleDomainInput.value = o.domain), (e.ruleRemoveCsp.checked = o.headersToRemove.includes('Content-Security-Policy')), (e.ruleRemoveXfo.checked = o.headersToRemove.includes('X-Frame-Options')), (e.ruleIndexInput.value = t), e.ruleDomainInput.focus());
			}
			if (o) {
				const e = parseInt(o.dataset.index, 10),
					t = currentSettings.customRules[e];
				if (confirm(chrome.i18n.getMessage('confirm_delete_rule', [t.domain]) || `Are you sure you want to delete the rule for ${t.domain}?`)) {
					const t = currentSettings.customRules.filter((t, n) => n !== e);
					await a(t);
				}
			}
		}));
	const i = document.querySelectorAll('.sidebar-menu .menu-list a'),
		c = document.querySelectorAll('.config-section'),
		d = document.querySelector('.content-section.is-active');
	(d && ((d.style.display = 'block'), s(d)),
		c.forEach((e) => {
			const t = e.querySelector('summary'),
				n = e.querySelector('.config-options');
			t.addEventListener('click', (t) => {
				(t.preventDefault(),
					e.open ?
						r(n, () => {
							e.open = !1;
						})
					:	((e.open = !0), l(n)));
			});
		}),
		i.forEach((e) => {
			e.addEventListener('click', (t) => {
				t.preventDefault();
				const n = document.querySelector('.sidebar-menu a.is-active'),
					o = document.querySelector('.content-section.is-active'),
					a = e.dataset.target,
					r = document.getElementById(a);
				e !== n && r && (n && n.classList.remove('is-active'), e.classList.add('is-active'), o && (o.classList.remove('is-active'), (o.style.display = 'none')), r.classList.add('is-active'), (r.style.display = 'block'), s(r));
			});
		}));
});
