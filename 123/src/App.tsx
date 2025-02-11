import { createSignal } from "solid-js";
import "./App.css";
import * as d3 from "d3";
import { invoke } from '@tauri-apps/api/core';

import { isAvailable, scan, Tag, ScanKind, ScanOptions } from '@tauri-apps/plugin-nfc';

interface DataPacket {
    index: Number,
    packetNumber: Number,
    time: String,
    temp: Number
}

function App() {
    //commented so i can use on windows 
    // const [avial, setAvial] = createSignal<Boolean>(false);
    // isAvailable().then((a) => {
    //     setAvial(a);
    // });

    // const [tag, setTag] = createSignal<Tag>();

    // const scanType: ScanKind = {
    //     type: 'tag', // or 'tag',
    // };

    // const options: ScanOptions = {
    //     keepSessionAlive: false,
    //     // configure the messages displayed in the "Scan NFC" dialog on iOS
    //     message: 'Scan a NFC tag',
    //     successMessage: 'NFC tag successfully scanned',
    // };


    // Set Dimensions

    const xSize = 250;
    const ySize = 500;
    const margin = 50;
    
    const yMax = ySize - margin * 2;

    var numPoints = 0;
    const maxPoints = 10;

    //var dataPacket = {'index':index(),'packetNumber':Number, 'time':String, 'temp':Number};
    let dataPacketList: DataPacket[] = [];

    function updateIndex() {
        for (var i = 0; i <= (maxPoints - 1); i++) {
            if (dataPacketList[i]) {
                dataPacketList[i].index = i;
            }
        }
    }

    async function plot() {
        let xMax = ((document.getElementById('myPlot')?.clientWidth)|| 100)-margin*2;
        var thisDataPacket: DataPacket = {
            index: 0,
            packetNumber: numPoints,
            time: Date.now().toString(), // TODO: what you need to do
            temp: Math.random() * yMax
        }
        dataPacketList.push(thisDataPacket);


        if (dataPacketList.length >= maxPoints + 1) {
            dataPacketList.splice(0, 1);
        }
        updateIndex();
        //console.log(dataPacketList[dataPacketList.length]);
        //console.log(dataPacketList);

        numPoints++;
        //clear all 
        d3.selectAll("svg > *").remove();

        // Append SVG Object to the Page
        const svg = d3.select("#myPlot");
        // X Axis
        const x = d3.scaleLinear()
            .domain([0, 500])
            .range([margin,xMax]);

        let xAxisGenerator = d3.axisBottom(x);
        xAxisGenerator.ticks(maxPoints);
        xAxisGenerator.tickSize(-yMax);
        xAxisGenerator.tickFormat((d, i) => {
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
            // .attr("class", "text_on_point")
            .attr("x", function (d) { return (d.index * (xMax / maxPoints)); })
            .attr("y", function (d) { return (d.temp); })
            .text(function (d) { return d.packetNumber; });

        svg.selectAll(".text")
            .data(dataPacketList)
            .enter().append("text")
            // .attr("class", "text_on_x_axis")
            //.attr('transform', 'translate(' + function(d) { return (d.index*(xMax/maxPoints)); } + ', ' + 0 + ')')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(10)')
            ;

        // svg.selectAll("svg")
        //     .attr("width:", "100px")
        //     ;


    }

    return (
        /* <p>{avial() ? "true" : "false"}</p> */

        <main class="container">
            <h1>MEng Project App</h1>

            <svg id="myPlot" style="width:100%;height:500px;"></svg>
            {/* TODO: Michael */}
            <button id="update-button" onclick={() => {
                console.log("new data");
                // scan({ type: "tag" }).catch(() => {
                //     console.log("123")
                // }).then(() => {
                //     console.log("23234")
                // }).finally(() => {
                //     console.log("12344")
                // });
                plot();
            }}>Update Graph</button>
        </main>
    );
}

export default App;
