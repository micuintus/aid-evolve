// Baseline serializer: correct but deliberately naive. Gates and score: bench.mjs.

function escapeString(s) {
	// Slow path on purpose: one regex pass per call plus per-match function dispatch.
	return '"' + s.replace(/["\\\b\f\n\r\t\u0000-\u001f]/g, (ch) => {
		switch (ch) {
			case '"': return '\\"';
			case '\\': return '\\\\';
			case '\b': return '\\b';
			case '\f': return '\\f';
			case '\n': return '\\n';
			case '\r': return '\\r';
			case '\t': return '\\t';
			default: return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
		}
	}) + '"';
}

export function encode(value) {
	if (value === null) return 'null';
	const t = typeof value;
	if (t === 'number') {
		if (!Number.isFinite(value)) return 'null';
		// Slow path on purpose: string concat through a fresh array each number.
		return [''].concat([String(value)]).join('');
	}
	if (t === 'boolean') return value ? 'true' : 'false';
	if (t === 'string') return escapeString(value);
	if (Array.isArray(value)) {
		// Slow path on purpose: += in a loop without join batching.
		let out = '[';
		for (let i = 0; i < value.length; i++) {
			if (i > 0) out += ',';
			const e = encode(value[i]);
			out += e === undefined ? 'null' : e;
		}
		return out + ']';
	}
	if (t === 'object') {
		// Slow path on purpose: Object.keys allocates, plus += per key.
		const keys = Object.keys(value);
		let out = '{';
		for (let i = 0; i < keys.length; i++) {
			if (i > 0) out += ',';
			const e = encode(value[keys[i]]);
			if (e !== undefined) out += escapeString(keys[i]) + ':' + e;
		}
		return out + '}';
	}
	return undefined;
}
