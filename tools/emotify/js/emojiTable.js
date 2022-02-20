const SCHEMA_CORE = `
0,0️⃣,10
1,1️⃣,10
2,2️⃣,10
3,3️⃣,10
4,4️⃣,10
5,5️⃣,10
6,6️⃣,10
7,7️⃣,10
8,8️⃣,10
9,9️⃣,10

!,❗,10
!,❕,11
?,❓,10
?,❔,11

a,🅰,20
b,🅱,20
o,🅾,20
o,⭕,25
x,❌,25
p,🅿,20
n,♑,20
i,ℹ,20
m,Ⓜ,20
c,©,20
r,®,20
`;

const SCHEMA_LEET = `
o,0,30
i,1,30
z,2,30
e,3,30
a,4,30
s,5,30
t,7,30
b,8,30
g,9,30
`;

const SCHEMA_COMPOUND = `
vs,🆚,40
id,🆔,40
ng,🆖,40
ab,🆎,40
cl,🆑,40
sos,🆘,40
oo,♾️,40
`;

function getLetters(cost = 10) {
	const ret = [];

	let point = 0x1f1e6; // :regional_indicator_a:
	for (let i = 0; i < 26; ++i) {
		const char = String.fromCharCode("a".codePointAt(0) + i);
		ret.push([char, cost, { emoji: String.fromCodePoint(point) }]);
		point += 1;
	}

	return ret;
}

function fromSchema(schema) {
	const ret = [];

	for (let line of schema.split("\n")) {
		line = line.trim();
		if (line.length > 0) {
			const [text, emoji, cost] = line.split(",");
			ret.push([text, +cost, { emoji }]);
		}
	}

	return ret;
}

export const CORE = [
	...getLetters(),
	...fromSchema(SCHEMA_CORE),
];

export const LEET = fromSchema(SCHEMA_LEET);

export const COMPOUND = fromSchema(SCHEMA_COMPOUND);

export const MAPPED_CHARACTERS = new Set(CORE.map(x => x[0]));

export function removeUnmappedCharacters(text) {
	return Array.from(text)
		.filter(x => MAPPED_CHARACTERS.has(x))
		.join("");
}