const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});

// Set Dimensions

const xMax = 500;
const yMax = 400;
var numPoints = 0;
const maxPoints = 10;
var dataPacket = {'index':Number, 'time':String, 'temp':Number}
var dataPacketList = [];
async function plot() {  

  numPoints++;
  dataPacket.index = numPoints;
  dataPacket.time = Date.now().toString();
  dataPacket.temp = Math.random() * yMax;

  dataPacketList.push(dataPacket);
  // Append SVG Object to the Page
  const svg = d3.select("#myPlot")
    .append("svg")
    .append("g")
    .attr("transform","translate(" + 40 + "," + 40 + ")")
    ;

  // X Axis
  const x = d3.scaleLinear()
    .domain([0, 500])
    .range([0, xMax]);

  svg.append("g")
    .attr("transform", "translate(0," + yMax + ")")
    .call(d3.axisBottom(x));

  // Y Axis
  const y = d3.scaleLinear()
    .domain([0, 500])
    .range([ yMax, 0]);

  svg.append("g")
    .call(d3.axisLeft(y));

  // Dots
  svg.append('g')
    .selectAll("dot")
    .data(dataPacketList).enter()
    .append("circle")
    .attr("cx", function (d) { return d.index } )
    .attr("cy", function (d) { return d.temp } )
    .attr("r", 3)
    .style("fill", "Red");

    // Add the line
    svg.append("path")
      .datum(dataPacketList)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return (d.index) })
        .y(function(d) { return (d.temp) })
        )
}

document.getElementById("update-button").addEventListener("click", function (event) {
  event.preventDefault();
  console.log("hello");
  plot();
});
