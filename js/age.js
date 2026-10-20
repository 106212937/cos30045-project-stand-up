(() => {
  const tooltip = d3.select("#tooltip");
  const formatNumber = d3.format(",");
  const formatDec = d3.format(".1f");

  function getCount(row) {
    const val = row["Sum(Count of cases)"] ?? row["Count of cases"] ?? row["Hospitalisations"] ?? 0;
    return +val;
  }

  const ageOrder = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+", "≥75"];

  d3.csv("data/age_group_2021.csv").then(raw => {
    const data = raw.map(d => ({
      age: (d["Age group"] || "").trim(),
      cases: getCount(d)
    })).sort((a, b) => ageOrder.indexOf(a.age) - ageOrder.indexOf(b.age));

    const totalCases = d3.sum(data, d => d.cases);
    if (totalCases > 0) {
      d3.select("#kpi-total").text(formatNumber(totalCases));
    }

    const width = 960, height = 340;
    const margin = { top: 30, right: 30, bottom: 45, left: 65 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#chart-age")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.age))
      .range([0, innerW])
      .padding(0.32);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.cases) * 1.12])
      .range([innerH, 0]);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "12px")
      .text("Hospitalised Injuries (2021)");

    g.selectAll(".age-bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "age-bar")
      .attr("x", d => x(d.age))
      .attr("y", d => y(d.cases))
      .attr("width", x.bandwidth())
      .attr("height", d => innerH - y(d.cases))
      .attr("rx", 4)
      .attr("fill", d => (d.age === "17-25" || d.age === "40-64") ? "#0a2240" : "#163e6c")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#1d9a8c");
        const pct = totalCases ? (d.cases / totalCases) * 100 : 0;
        tooltip.style("opacity", 1)
          .html(`<strong>Age Group: ${d.age}</strong><br>Injuries: ${formatNumber(d.cases)}<br>Share of 2021 Total: ${formatDec(pct)}%`);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 12) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("fill", (d.age === "17-25" || d.age === "40-64") ? "#0a2240" : "#163e6c");
        tooltip.style("opacity", 0);
      });

    g.selectAll(".age-label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.age) + x.bandwidth() / 2)
      .attr("y", d => y(d.cases) - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#1e293b")
      .text(d => formatNumber(d.cases));
  }).catch(err => console.error("Error loading age_group_2021.csv:", err));
})();