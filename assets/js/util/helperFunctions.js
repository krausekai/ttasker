const _this = module.exports = {};

// use a function call rate limiter
// if `fn` is a function with parameters, it needs to be wrapped in an anon func
let debounceTimers = [];
_this.debounce = function(id, fn, wait, replace) {
	function clearDebounce(id) {
		clearTimeout(debounceTimers[id]);
		debounceTimers[id] = null;
	}

	if (debounceTimers[id]) {
		// replace existing setTimeout with a new one
		if (replace) clearDebounce(id);
		// otherwise, reject til the existing setTimeout is complete
		else return;
	}

	let time = Date.now();
	debounceTimers[id] = setTimeout(() => {
		fn();
		clearDebounce(id);
	}, (time + wait - Date.now()));
}

_this.isArrEmpty = function(arr) {
	if (!Array.isArray(arr) || !arr.length) return true;
	else return false;
}

// unique array by stringify comparison
// easiest but slowest method for object arrs
// problematic for things that don't convert via stringify (e.g. new Date())
_this.uniqueArray = function (a) {
	return [...new Set(a.map(o => JSON.stringify(o || "")))].map(s => JSON.parse(s));
}
