import { createSignal } from "solid-js";
import "./App.css";
import * as d3 from "d3";

import { ping, is_available, get_temperature } from 'tauri-plugin-nfcv-api'

interface DataPacket {
    index: number,
    packetNumber: number,
    time: string, // TODO: what you need to do
    //value between 28 and 42. rand()*14 = 0 -> 14, +28 => 28->42
    temp: number
};

function App() {
    const [temp, setTemp] = createSignal<number>();

    const xSize = 300;
    const ySize = 375;
    const margin = 0;
    const padding = 50;

    //const yMax = ySize - margin * 2;
    const yMax = ySize - padding;
    const xMax = xSize - padding;
    var numPoints = 0;
    const maxPoints = 10;

    let dataPacketList: DataPacket[] = [];


    function updateIndex() {
        for (var i = 0; i <= (maxPoints - 1); i++) {
            if (dataPacketList[i]) {
                dataPacketList[i].index = i;
            }
        }
    }
    async function plot(temp: number) {
        var thisDataPacket: DataPacket = {
            index: 0,
            packetNumber: numPoints,
            time: Date.now().toString(), // TODO: what you need to do
            //value between 28 and 42. rand()*14 = 0 -> 14, +28 => 28->42
            temp: temp
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
            .range([padding / 2, xMax]);

        let xAxisGenerator = d3.axisBottom(x);
        xAxisGenerator.ticks(maxPoints);
        xAxisGenerator.tickSize(5);
        xAxisGenerator.tickFormat((d, i) => {
            if (dataPacketList[i]) {
                return (dataPacketList[i].index);
            } else {
                return "";
            }
        });



        svg.append("g")
            .call(xAxisGenerator)
            .attr("transform", "translate(" + padding / 2 + "," + (yMax + padding / 2) + ")")
            ;

        //warning: janky way of selecting only x axis text...
        svg.selectAll("text")
            .attr("font-size", "10")
            .attr("transform", "rotate(45)")
            ;

        // Y Axis
        const y = d3.scaleLinear()
            .domain([18, 23])
            .range([yMax, 0]);

        svg.append("g")
            .call(d3.axisLeft(y))
            .attr("transform", "translate(" + padding + "," + (padding / 2) + ")");

        // Dots
        svg.append('g')
            .selectAll("dot")
            .data(dataPacketList).enter()
            .append("circle")
            .attr("cx", function (d) { return (d.index * ((xMax - padding / 2) / maxPoints) + padding) })
            .attr("cy", function (d) { return (((-(d.temp) + 18) * yMax / 14 + yMax + padding / 2)) }) // what the fuck have i done. This was mostly trial and error
            .attr("r", 3)
            .style("fill", "Red")

        // (ymax * (temp - min) / (max - min)) + padding

        // Add the line
        svg.append("path")
            .datum(dataPacketList)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) { return (d.index * ((xMax - padding / 2) / maxPoints) + padding) })
                .y(function (d) { return ((-(d.temp) + 18) * yMax / 14 + yMax + padding / 2); })
            );

        //text on the points
        svg.selectAll(".text")
            .data(dataPacketList)
            .enter().append("text")
            // .attr("class", "text_on_point")
            .attr("x", function (d) { return (d.index * ((xMax - padding / 2) / maxPoints) + padding); })
            .attr("y", function (d) { return ((-(d.temp) + 28) * yMax / 14 + yMax + padding / 2); })
            .text(function (d) { return null; });



        // svg.selectAll("svg")
        //     .attr("width:", "100px")
        //     ;
    }


    return (
        <main>
            <div class="justify-self-center h-fit text-center" >
                <h1 class="tracking-wide font-semibold text-3xl" >Vital Sign Monitor</h1>
                <h1 class="text-base" >Hold phone to device to get reading</h1>

                <svg id="myPlot" class="w-full h-96"></svg>

                {temp()}
            </div>

            <button class="w-full h-10 rounded-2xl border-2 active:bg-gray-600" id="update-button" onClick={() => { get_temperature().then((data) => {setTemp(data.temperature);plot(data.temperature);}).catch((s) => setTemp(s)); }}>Read Device</button>
        </main>
    );
}

export default App;
