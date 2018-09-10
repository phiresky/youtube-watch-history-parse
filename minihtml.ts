declare global {
	namespace JSX {
		interface IntrinsicElements {
			[name: string]: any;
		}
	}
}

export function createElement(
	tag: string,
	props: { [name: string]: string | number } | undefined,
	...children: string[]
) {
	return `<${tag}${Object.entries(props || {})
		.map(([k, v]) => ` ${k}="${v}"`)
		.join("")}>${children.flat(Infinity).join("")}</${tag}>`;
}
