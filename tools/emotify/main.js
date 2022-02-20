import * as textfit from "./js/textfit.js";
import * as emojiTable from "./js/emojiTable.js";

/** @type {EmotifyState} */
let state = null;

class EmotifyState {
	constructor(results) {
		this._results = results;

		this._mapping = results.mapping
			.map(x => ({
				text: x.text,
				emoji: x.owner.data.emoji,
			}));

		this.showMapping();
		this.showMissing();
		this._copyAllString = results.mapping.map(x => x.owner.data.emoji).join(" ");

		console.log(this);
	}

	showMapping() {
		const target = document.getElementById("output-text");
		const merged = [...this.results.mapping, ...this.results.missing]
			.sort((a, b) => a.index - b.index);

		target.innerHTML = "";
		for (const item of merged) {
			let t;
			if (item.owner) {
				const emoji = item.owner.data.emoji;
				t = `<span class="emoji" data-value=${emoji}>${emoji}</span>`;
			} else {
				t = `<span class="missing">${item.text}</span>`;
			}
			target.insertAdjacentHTML("beforeend", t);
		}
	}

	showMissing() {
		const target = document.getElementById("output-missing");
		if (this.results.fullyMapped) {
			target.textContent = "No missing characters 👌";
		} else {
			const list = this.results.missing.map(x => `'` + x.text + `'`).join(", ");
			target.textContent = "Missing... " + list;
		}
	}

	get copyAllString() {
		return this._copyAllString;
	}

	get results() {
		return this._results;
	}
}

async function processInput() {
	const rawInput = document.getElementById("input-text").value;
	if (rawInput.length == 0) {
		return null;
	}

	const input = emojiTable.removeUnmappedCharacters(rawInput.toLowerCase());

	let options = [...emojiTable.CORE];
	if (document.getElementById("input-cb-compound").checked) {
		options.push(...emojiTable.COMPOUND);
	}
	if (document.getElementById("input-cb-leet").checked) {
		options.push(...emojiTable.LEET);
	}
	options = options.map(x => new textfit.TextOption(...x));

	return textfit.findBestFit(input, options);
}

// Bind form submission.
document.getElementById("input-form").onsubmit = () => {
	processInput()
		.then(async (results) => {
			document.getElementById("output-wrapper").hidden = !results;
			return results;
		})
		.then(results => state = results ? new EmotifyState(results) : null)
		.catch(err => console.error(err));
	return false;
};

// Bind copy all button.
document.getElementById("output-copyall").onclick = function () {
	if (state) {
		navigator.clipboard.writeText(state.copyAllString);
	}
};