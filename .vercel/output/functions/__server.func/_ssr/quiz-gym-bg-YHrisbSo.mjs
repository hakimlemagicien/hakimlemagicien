//#region node_modules/.nitro/vite/services/ssr/assets/quiz-gym-bg-YHrisbSo.js
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
/**
* Premium selection haptic. Safe on iOS Safari (no-op) and optimized for
* Chrome mobile where `navigator.vibrate` is natively supported.
*/
function triggerSelectionHaptic(durationMs = 25) {
	if (typeof navigator === "undefined") return;
	const vibrateFn = navigator.vibrate;
	if (typeof vibrateFn !== "function") return;
	try {
		vibrateFn(durationMs);
	} catch {}
}
var quiz_gym_bg_default = "/assets/quiz-gym-bg-CQgth5sC.jpg";
//#endregion
export { triggerSelectionHaptic as a, quiz_gym_bg_default as i, pageVariants as n, premiumTransition as r, pageTransition as t };
