(() => {
  const tooltip = d3.select("#tooltip");
  const formatNumber = d3.format(",");
  const formatDec = d3.format(".1f");

  function getCount(row) {
    const val = row["Sum(Count of cases)"] ?? row["Count of cases"] ?? row["Hospitalisations"] ?? 0;
    return +val;
  }

  d3.csv("data/road_user_2021.csv").then(raw => {
    let otherSum = 0;
    const data = [];

    raw.forEach(d => {
      const user = (d["Road user"] || "").trim();
      const cases = getCount(d);
      if (cases >= 1000 && user !== "Not applicable") {
        data.push({ user, cases });
      } else if (user !== "Not applicable") {
        otherSum += cases;
      }
    });

    data.sort((a, b) => b.cases - a.cases);
    if (otherSum > 0) {
      data.push({ user: "Other / Heavy Vehicles", cases: otherSum });
    }

    const totalCases = d3.sum(data, d => d.cases);
    data.forEach(d => {
      d.pct = (d.cases / totalCases) * 100;
    });

    const width = 500, height = 290;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select("#chart-roaduser")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g")
      .attr("transform", `translate(${width * 0.34},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.user))
      .range(["#0a2240", "#38bdf8", "#1d9a8c", "#94a3b8", "#f59e0b", "#cbd5e1"]);

    const pie = d3.pie()
      .value(d => d.cases)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.55)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(radius * 0.55)
      .outerRadius(radius + 7);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-size", "18px")
      .attr("font-weight", "700")
      .attr("fill", "#0a2240")
      .text("43.1%");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .text("2-Wheelers");

    g.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.user))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("d", arcHover);
        tooltip.style("opacity", 1)
          .html(`<strong>${d.data.user}</strong><br>Injuries: ${formatNumber(d.data.cases)}<br>Share: ${formatDec(d.data.pct)}%`);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 12) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(150).attr("d", arc);
        tooltip.style("opacity", 0);
      });

    const legend = svg.append("g")
      .attr("transform", `translate(${width * 0.65}, 35)`);

    const legendItems = legend.selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0, ${i * 36})`);

    legendItems.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 3)
      .attr("fill", d => color(d.user));

    legendItems.append("text")
      .attr("x", 22)
      .attr("y", 11)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#1e293b")
      .text(d => d.user);

    legendItems.append("text")
      .attr("x", 22)
      .attr("y", 25)
      .attr("font-size", "11px")
      .attr("fill", "#64748b")
      .text(d => `${formatNumber(d.cases)} (${formatDec(d.pct)}%)`);
  }).catch(err => console.error("Error loading road_user_2021.csv:", err));
})();