import * as React from "./minihtml";

function progress(text: string) {
	target.textContent = text;
}
document.body.addEventListener("dragover", ev => {
	ev.preventDefault();
	if (!ev.dataTransfer) throw Error(`no dataTransfer`);
	ev.dataTransfer.dropEffect = "move";
	document.body.style.backgroundColor = "green";
});
document.body.addEventListener("drop", ev => {
	document.body.style.backgroundColor = "initial";
	ev.preventDefault();
	if (!ev.dataTransfer) throw Error(`no dataTransfer`);
	const f = ev.dataTransfer.files[0];
	if (!f) throw "no file";
	parseFromFile(f);
});

function parseFromFile(f: File) {
	const url = URL.createObjectURL(f);
	console.log(url);
	const req = new XMLHttpRequest();
	req.addEventListener("load", ev => {
		progress("parsed html.");
		parseDocument(req.response);
	});
	req.responseType = "document";
	req.overrideMimeType("text/html");
	req.open("GET", url);
	req.send();
	console.time("parse");
	progress("parsing html...");
}

function groupBy<T, K, T2 = T>(ts: T[], getKey: (t: T) => K, getValue: (t: T) => T2) {
	const m = new Map<K, T2[]>();
	for (const t of ts) {
		const k = getKey(t);
		if (!m.has(k)) m.set(k, []);
		const arr = m.get(k)!;
		arr.push(getValue(t));
	}
	return Array.from(m.entries());
}

function normalize(x: string) {
	return x.replace(/[\t\n\r ]+/g, " ").trim();
}

async function parseDocument(doc: Document) {
	progress("aggregating...");
	await new Promise(requestAnimationFrame);

	console.log({ doc });
	let fail = 0;

	const all = [];
	for (const oc of doc.querySelectorAll("div.outer-cell")) {
		const c = oc.querySelector(".content-cell");
		const [video, channel] = c.querySelectorAll("a");
		if (!video || !channel) {
			fail++;
			continue;
		}
		const [vurl, curl] = [video.href, channel.href];
		const [vname, cname] = [normalize(video.textContent!), normalize(channel.textContent!)];

		all.push({
			channel: {
				name: cname,
				id: curl
			},
			video: {
				name: vname,
				id: vurl
			}
		});
	}
	console.log("failures: ", fail);
	const agg = groupBy(all, t => t.channel.id, t => t);
	const sortAgg = (a: [any, any[]], b: [any, any[]]) => b[1].length - a[1].length;
	agg.sort(sortAgg);
	const n = 100;
	document.querySelector("div")!.innerHTML = (
		<>
			<h2>Top {n} channels watched</h2>
			<ol>
				{agg.slice(0, n).map(([c, vs]) => {
					return (
						<li>
							<details>
								<summary>
									<a href={c}>{[...new Set(vs.map(x => x.channel.name))]}</a>: {vs.length} videos
								</summary>
								<ol>
									{groupBy(vs, v => v.video.id, v => v.video)
										.sort(sortAgg)
										.map(([id, v]) => (
											<li>
												<a href={id}>
													{v.length}
													x: {v[0].name}
												</a>
											</li>
										))}
								</ol>
							</details>
						</li>
					);
				})}
			</ol>
		</>
	);
}
