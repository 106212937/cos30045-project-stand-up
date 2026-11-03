// Week 8: Rule of Three Linear Scale for Responsive SVG Text (12px on desktop -> scales up in viewBox on mobile)
const fontSizeScale = d3.scaleLinear()
  .domain([315, 1000])
  .range([26, 12])
  .clamp(true);

function resizeCharts() {
  const windowWidth = window.innerWidth;
  d3.selectAll(".axis text, .axis-label")
    .style("font-size", `${fontSizeScale(windowWidth)}px`);
}

window.addEventListener("resize", resizeCharts);

// Week 8: Shared Accessible Tooltip & Screen Reader Announcer Helper
window.a11yTooltip = {
  show(event, htmlContent, plainTextAnnouncement) {
    const tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 1).html(htmlContent);

    // Position using mouse coordinates if triggered by mouse, or element bounding box if triggered by keyboard Tab/Focus
    if (event.pageX && event.pageY) {
      tooltip.style("left", (event.pageX + 12) + "px")
             .style("top", (event.pageY - 28) + "px");
    } else if (event.target) {
      const rect = event.target.getBoundingClientRect();
      tooltip.style("left", (rect.left + window.scrollX + rect.width / 2) + "px")
             .style("top", (rect.top + window.scrollY - 36) + "px");
    }

    // Announce to screen reader via polite aria-live region
    const announcer = document.getElementById("tooltip-announcer");
    if (announcer && plainTextAnnouncement) {
      announcer.textContent = plainTextAnnouncement;
    }
  },
  move(event) {
    if (event.pageX && event.pageY) {
      d3.select("#tooltip")
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    }
  },
  hide() {
    d3.select("#tooltip").style("opacity", 0);
  },
  handleArrowNav(event, selectorTag) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = event.target.nextElementSibling;
      if (next && next.tagName.toLowerCase() === selectorTag) next.focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prev = event.target.previousElementSibling;
      if (prev && prev.tagName.toLowerCase() === selectorTag) prev.focus();
    }
  }
};