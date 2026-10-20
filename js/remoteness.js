(() => {
  const tooltip = d3.select("#tooltip");
  const formatNumber = d3.format(",");
  const formatDec = d3.format(".1f");

  function getCount(row) {
    const val = row["Sum(Count of cases)"] ?? row["Count of cases"] ?? row["Hospitalisations"] ?? 0;
    return +val;
  }

  const rateLookup = {
    "Major Cities": 142.1,
    "Regional": 171.6,
    "Remote": 224.6
  };
  const remotenessOrder = ["Major Cities", "Regional", "Remote"];

  d3.csv("data/remoteness_2021.csv").then(raw => {
    const data = raw
      .filter(d => d["ABS remoteness area"] && d["ABS remoteness area"] !== "Missing")
      .map(d => {
        const area = d["ABS remoteness area"].trim();
        return {
          area: area,
          cases: getCount(d),
          rate: rateLookup[area] || 0
        };
      })
      .sort((a, b) => remotenessOrder.indexOf(a.area) - remotenessOrder.indexOf(b.area));

    const width = 500, height = 270;
    const margin = { top: 20, right: 65, bottom: 40, left: 100 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#chart-remoteness")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
      .domain(data.map(d => d.area))
      .range([0, innerH])
      .padding(0.35);

    const x = d3.scaleLinear().range([0, innerW]);

    const colorScale = d3.scaleOrdinal()
      .domain(["Major Cities", "Regional", "Remote"])
      .range(["#0a2240", "#38bdf8", "#1d9a8c"]);

    const xAxisG = g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`);

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y));

    const bars = g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.area))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("rx", 4)
      .attr("fill", d => colorScale(d.area))
      .style("cursor", "pointer");

    const labels = g.selectAll(".val-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "val-label")
      .attr("y", d => y(d.area) + y.bandwidth() / 2 + 4)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#1e293b");

    function updateMetric(mode) {
      const isRate = mode === "rate";
      const maxVal = d3.max(data, d => isRate ? d.rate : d.cases);
      x.domain([0, maxVal * 1.15]);

      xAxisG.transition().duration(600)
        .call(d3.axisBottom(x).ticks(5));

      bars.transition().duration(600)
        .attr("width", d => x(isRate ? d.rate : d.cases));

      labels.transition().duration(600)
        .attr("x", d => x(isRate ? d.rate : d.cases) + 8)
        .text(d => isRate ? `${formatDec(d.rate)} / 100k` : formatNumber(d.cases));

      bars.on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        tooltip.style("opacity", 1)
          .html(`<strong>${d.area} (2021)</strong><br>Absolute Injuries: ${formatNumber(d.cases)}<br>Rate per 100k Pop: ${formatDec(d.rate)}`);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 12) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });
    }

    updateMetric("count");

    d3.select("#btn-rem-count").on("click", function () {
      d3.selectAll("#btn-rem-count, #btn-rem-rate").classed("active", false);
      d3.select(this).classed("active", true);
      updateMetric("count");
    });

    d3.select("#btn-rem-rate").on("click", function () {
      d3.selectAll("#btn-rem-count, #btn-rem-rate").classed("active", false);
      d3.select(this).classed("active", true);
      updateMetric("rate");
    });
  }).catch(err => console.error("Error loading remoteness_2021.csv:", err));
})();