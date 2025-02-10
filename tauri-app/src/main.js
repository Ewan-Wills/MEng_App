import { isAvailable } from '@tauri-apps/plugin-nfc';
const {isAvailable} = window.__TAURI__.plugin-nfc;
const canScanNfc = await isAvailable();

console.log(canScanNfc);

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

const xSize = 500;
const ySize = 500;
const margin = 100;
const xMax = xSize - margin * 2;
const yMax = ySize - margin * 2;

var numPoints = 0;
const maxPoints = 10;
var currSize;
//var dataPacket = {'index':index(),'packetNumber':Number, 'time':String, 'temp':Number};
var dataPacketList = [];

function updateIndex() {
    for (var i = 0; i <= (maxPoints - 1); i++) {
        if (dataPacketList.at(i)) {
            dataPacketList.at(i).index = i;
        }
    }
}

async function plot() {

    var thisDataPacket = { 'index': Number, 'packetNumber': Number, 'time': String, 'temp': Number };

    thisDataPacket.packetNumber = numPoints;
    thisDataPacket.time = Date.now().toString();
    thisDataPacket.temp = Math.random() * yMax;
    dataPacketList.push(thisDataPacket);


    if (dataPacketList.length >= maxPoints + 1) {
        dataPacketList.splice(0, 1);
    }
    updateIndex();
    //console.log(dataPacketList[dataPacketList.length]);
    console.log(dataPacketList);

    numPoints++;
    //clear all 
    d3.selectAll("svg > *").remove();

    // Append SVG Object to the Page
    const svg = d3.select("#myPlot")
        .append("svg")
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        ;
    // X Axis
    const x = d3.scaleLinear()
        .domain([0, 500])
        .range([0, xMax]);

    let xAxisGenerator = d3.axisBottom(x);
    xAxisGenerator.ticks(maxPoints);
    xAxisGenerator.tickSize(-yMax);
    xAxisGenerator.tickFormat(function (d, i) {
        if (dataPacketList[i]) {
            return (dataPacketList[i].index);
        } else {
            return "";
        }
    });



    svg.append("g")
        .call(xAxisGenerator)
        .attr("transform", "translate(0," + yMax + ")")
        ;

    svg.selectAll("text")
        .attr("font-size", "10")
        .attr("transform", "rotate(45)")
    // Y Axis
    const y = d3.scaleLinear()
        .domain([0, 500])
        .range([yMax, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Dots
    svg.append('g')
        .selectAll("dot")
        .data(dataPacketList).enter()
        .append("circle")
        .attr("cx", function (d) { return (d.index * (xMax / maxPoints)) })
        .attr("cy", function (d) { return d.temp })
        .attr("r", 3)
        .style("fill", "Red");

    // Add the line
    svg.append("path")
        .datum(dataPacketList)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return (d.index * (xMax / maxPoints)) })
            .y(function (d) { return (d.temp) })
        );

    //text on the points
    svg.selectAll(".text")
        .data(dataPacketList)
        .enter().append("text")
        .attr("class", "text_on_point")
        .attr("x", function (d) { return (d.index * (xMax / maxPoints)); })
        .attr("y", function (d) { return (d.temp); })
        .text(function (d) { return d.packetNumber; });

    svg.selectAll(".text")
        .data(dataPacketList)
        .enter().append("text")
        .attr("class", "text_on_x_axis")
        //.attr('transform', 'translate(' + function(d) { return (d.index*(xMax/maxPoints)); } + ', ' + 0 + ')')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(10)')
        ;


}

document.getElementById("update-button").addEventListener("click", function (event) {
    event.preventDefault();
    console.log("new data");
    plot();
});
