(() => {
  const tooltip = d3.select("#tooltip");
  const formatNumber = d3.format(",");

  function getCount(row) {
    const val = row["Sum(Count of cases)"] ?? row["Count of cases"] ?? row["Hospitalisations"] ?? 0;
    return +val;
  }

  d3.csv("data/trend_2011_2021.csv").then(raw => {
    const data = raw.map(d => ({
      year: +d["Calendar year"],
      cases: getCount(d)
    })).sort((a, b) => a.year - b.year);

    const width = 960, height = 360;
    const margin = { top: 30, right: 40, bottom: 45, left: 65 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#chart-trend")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, innerW]);

    const y = d3.scaleLinear()
      .domain([33000, d3.max(data, d => d.cases) * 1.03])
      .range([innerH, 0]);

    const yGrid = g.append("g").attr("class", "grid");

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format("d")));

    const yAxisG = g.append("g").attr("class", "axis");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "12px")
      .text("Hospitalised Injuries (Cases)");

    const lineGenerator = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.cases))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#163e6c")
      .attr("stroke-width", 3);

    const dots = g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 5.5)
      .attr("fill", d => d.year === 2020 ? "#d97706" : "#38bdf8")
      .attr("stroke", "#0a2240")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("r", 8);
        let note = "";
        if (d.year === 2012) note = "<br><em>Note: Vic ED exclusion started Jul 2012</em>";
        if (d.year === 2017) note = "<br><em>Note: NSW ED exclusion started Jun 2017</em>";
        if (d.year === 2020) note = "<br><em>Note: COVID-19 lockdown traffic dip</em>";
        tooltip.style("opacity", 1)
          .html(`<strong>Year: ${d.year}</strong><br>Injuries: ${formatNumber(d.cases)}${note}`);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 12) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(150).attr("r", 5.5);
        tooltip.style("opacity", 0);
      });

    const covidPoint = data.find(d => d.year === 2020);
    const annotation = g.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#d97706")
      .text("2020 COVID-19 Dip (38,054)");

    function updateScale(zeroBaseline) {
      const minVal = zeroBaseline ? 0 : 33000;
      y.domain([minVal, d3.max(data, d => d.cases) * 1.04]);

      yGrid.transition().duration(600)
        .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));

      yAxisG.transition().duration(600)
        .call(d3.axisLeft(y).ticks(6));

      path.transition().duration(600)
        .attr("d", lineGenerator);

      dots.transition().duration(600)
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.cases));

      if (covidPoint) {
        annotation.transition().duration(600)
          .attr("x", x(2020) - 20)
          .attr("y", y(covidPoint.cases) + 22);
      }
    }

    updateScale(false);

    d3.select("#btn-scale-focus").on("click", function () {
      d3.selectAll("#btn-scale-focus, #btn-scale-zero").classed("active", false);
      d3.select(this).classed("active", true);
      updateScale(false);
    });

    d3.select("#btn-scale-zero").on("click", function () {
      d3.selectAll("#btn-scale-focus, #btn-scale-zero").classed("active", false);
      d3.select(this).classed("active", true);
      updateScale(true);
    });
  }).catch(err => console.error("Error loading trend_2011_2021.csv:", err));
})();