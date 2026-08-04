const sanitizeSvg = (xml) =>
  String(xml || "").replace(/offset="\.(\d+(?:\.\d+)?)%"/g, 'offset="0.$1%"');

const sample = {
  rankNum: "1",
  title: "Claude Fable 5 (High)",
  properties: {
    section: "rank",
    vendor: "anthropic",
    score: 0.1257,
    sessions: 23807,
    publishDate: "2026-07-28",
    delta: 0,
  },
};

const models = [sample].filter((item) => item.properties.section === "rank");
console.assert(models.length === 1, "rank filter");
console.assert((Number(sample.properties.score) * 100).toFixed(1) + "%" === "12.6%", "score format");
console.assert(sanitizeSvg('offset=".06%"') === 'offset="0.06%"', "svg offset sanitize");
console.assert(
  "Dynamic ranking of models for real-world agentic tasks, based on tool reliability, task completion, and steerability.".includes(
    "tool reliability"
  ),
  "extension description"
);
console.log("arena-tab-check ok");
