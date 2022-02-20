/**
 * @param {String} sourceText
 * @param {Iterable} optionList
 */
export function findBestFit(sourceText, options) {
	const reservations = new Reservations(sourceText);
	let bestCost = Infinity;
	let bestCoverage = 0;
	let bestSolution = null;

	const checkAnswer = (curReservations, curCost) => {
		const curCoverage = curReservations.getCoverage();
		if (curCoverage > bestCoverage || (curCoverage == bestCoverage && curCost < bestCost)) {
			bestCost = curCost;
			bestCoverage = curCoverage;
			bestSolution = curReservations.export();
		}
	}

	const match = (availableOptions, curCost) => {
		if (reservations.isFullyMapped()) {
			checkAnswer(reservations);
			return;
		}

		if (availableOptions.isEmpty()) {
			const copy = reservations.clone();
			const fragments = copy.getFragments();

			for (const { index, text } of fragments) {
				for (let i = 0; i < text.length; ++i) {
					const option = availableOptions.takeLetter(text.charAt(i));
					if (option) {
						copy.reserve(index + i, option);
					}
				}
			}

			checkAnswer(copy);
			return;
		}

		const curOption = availableOptions.takeNext();
		for (const index of reservations.matchAll(curOption)) {
			reservations.reserve(index, curOption);
			match(availableOptions.clone(), curCost + curOption.cost);
			reservations.free(index);
		}
		match(availableOptions.clone(), curCost);
	};

	const pruned = options.filter(x => sourceText.includes(x.text));
	const ol = new OptionList(pruned);
	console.log(ol);
	match(ol, 0);

	return {
		input: sourceText,
		fullyMapped: bestCoverage == sourceText.length,
		coverage: bestCoverage,
		cost: bestCost,
		mapping: bestSolution.mapping,
		missing: bestSolution.missing,
	};
}

export class TextOption {
	constructor(text, cost, customData) {
		this._text = text;
		this._cost = cost;
		this._data = customData;
	}

	get text() {
		return this._text;
	}

	get length() {
		return this._text.length;
	}

	get cost() {
		return this._cost;
	}

	get data() {
		return this._data;
	}
}

class Reservations {
	/**
	 * @param {String} sourceText
	 */
	constructor(sourceText) {
		this._text = sourceText;
		this._mapping = new Map();
		this._fragments = null;
	}

	reserve(start, owner) {
		this._mapping.set(start, owner);
		this._fragments = null;
	}

	free(start) {
		this._mapping.delete(start);
		this._fragments = null;
	}

	getCoverage() {
		const values = Array.from(this._mapping.values());
		return values.reduce((prev, cur) => prev + cur.length, 0);
	}

	isFullyMapped() {
		return this.getCoverage() == this._text.length;
	}

	clone() {
		const ret = new Reservations(this._text);
		ret._mapping = new Map(this._mapping);
		if (this._fragments) {
			ret._fragments = [...this._fragments];
		}
		return ret;
	}

	export() {
		const entries = Array.from(this._mapping);
		entries.sort((a, b) => a[0] - b[0]);
		const mapping = entries.map(([index, owner]) => ({ index, owner }));
		const missing = [...this.getFragments()];
		return { mapping, missing };
	}

	matchAll(option) {
		const ret = [];
		for (const { index, text } of this.getFragments()) {
			for (let i = 0; i < text.length; ++i) {
				if (text.startsWith(option.text, i)) {
					ret.push(i + index);
				}
			}
		}
		ret.reverse();
		return ret;
	}

	getFragments() {
		if (!this._fragments) {
			this._fragments = this._extractNewFragments();
		}
		return this._fragments;
	}

	_extractNewFragments() {
		const keys = Array.from(this._mapping.keys());
		keys.sort((a, b) => a - b);
		const ret = [];

		const add = (index, text) => {
			if (text.length > 0) {
				ret.push({ index, text });
			}
		};

		// No reservations special case
		if (keys.length == 0) {
			add(0, this._text);
			return ret;
		}

		// Before first key
		add(0, this._text.slice(0, keys[0]));

		// Between first and last keys
		{
			let a = 0;
			let b = 1;
			while (b < keys.length) {
				const startPos = keys[a] + this._mapping.get(keys[a]).length;
				add(startPos, this._text.slice(startPos, keys[b]));
				a += 1;
				b += 1;
			}
		}

		// After the last key
		{
			const last = keys[keys.length - 1];
			const startPos = last + this._mapping.get(last).length;
			add(startPos, this._text.slice(startPos));
		}

		return ret;
	}
}

class OptionList {
	constructor(allOptions) {
		this._data = new Map();
		this._letterlikes = new Map();

		for (const option of allOptions) {
			if (option.length == 1) {
				if (!this._letterlikes.has(option.text)) {
					this._letterlikes.set(option.text, []);
				}
				this._letterlikes.get(option.text).push(option);
			} else {
				if (!this._data.has(option.cost)) {
					this._data.set(option.cost, []);
				}
				this._data.get(option.cost).push(option);
			}
		}

		Array.from(this._letterlikes.values())
			.forEach(x => x.sort((a, b) => b.cost - a.cost));
	}

	takeNext() {
		if (this.isEmpty()) {
			throw new OutOfOptionsError();
		}

		const keys = Array.from(this._data.keys());
		keys.sort((a, b) => a - b);
		const min = keys[0];

		const ret = this._data.get(min).pop();
		if (this._data.get(min).length == 0) {
			this._data.delete(min);
		}
		return ret;
	}

	takeLetter(letter) {
		const target = this._letterlikes.get(letter);
		if (!target) {
			return null;
		}
		const ret = target.pop();
		if (target.length == 0) {
			this._letterlikes.delete(letter);
		}
		return ret;
	}

	clone() {
		const ret = new OptionList([]);
		for (const [cost, entries] of this._data) {
			ret._data.set(cost, [...entries]);
		}
		for (const [letter, options] of this._letterlikes) {
			ret._letterlikes.set(letter, [...options]);
		}
		return ret;
	}

	isEmpty() {
		return this._data.size == 0;
	}
}

class OutOfOptionsError extends Error {
	constructor() {
		super("Out of options.");
	}
}
