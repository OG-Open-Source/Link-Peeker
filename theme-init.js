// theme-init.js v1.0.0
(function () {
	const theme = localStorage.getItem('theme') || 'auto';
	let panelTheme = theme;
	if (theme === 'auto') {
		panelTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	document.documentElement.dataset.theme = panelTheme;
})();
