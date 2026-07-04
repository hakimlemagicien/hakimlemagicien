//#region node_modules/.nitro/vite/services/ssr/assets/motion-C5gqCalS.js
/** Premium mobile easing — shared across page, scroll, and skeleton motion. */
var premiumEase = [
	.22,
	1,
	.36,
	1
];
var premiumTransition = {
	duration: .32,
	ease: premiumEase
};
var pageTransition = {
	duration: .28,
	ease: premiumEase
};
var pageVariants = {
	initial: {
		opacity: 0,
		y: 12
	},
	animate: {
		opacity: 1,
		y: 0
	},
	exit: {
		opacity: 0,
		y: 10
	}
};
//#endregion
export { pageVariants as n, premiumTransition as r, pageTransition as t };
