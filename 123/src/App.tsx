import { createSignal } from "solid-js";
import "./App.css";
import * as d3 from "d3";
import { invoke } from '@tauri-apps/api/core';
import { open } from 'tauri-plugin-serialport-api';
import { Serialport } from 'tauri-plugin-serialport-api';

import { isAvailable, scan, Tag, ScanKind, ScanOptions } from '@tauri-apps/plugin-nfc';

import { BleDevice, getConnectionUpdates, startScan, sendString, readString, unsubscribe, subscribeString, stopScan, connect, disconnect, getScanningUpdates, read } from '@mnlphlp/plugin-blec'

interface DataPacket {
    index: Number,
    packetNumber: Number,
    time: String,
    temp: Number
}


function App() {
    const xSize = 300;
    const ySize = 375;
    const margin = 0;
    const padding = 50;

    //const yMax = ySize - margin * 2;
    const yMax = ySize - padding;
    const xMax = xSize - padding;
    var numPoints = 0;
    const maxPoints = 10;

    //var dataPacket = {'index':index(),'packetNumber':Number, 'time':String, 'temp':Number};
    let dataPacketList: DataPacket[] = [];

    const ESPOUT_CHARACTERISTIC_UUID = "cb6079df-c22b-4057-a25a-54cea28247e5";
    const APPOUT_CHARACTERISTIC_UUID = "5025585f-5363-43d9-888b-2ab9e77096ed";

    // const ESPaddress:string = "4CEBD66E1132";

    const dataBox = d3.select("#connectedBox");

    function deviceHandler(devices: BleDevice[]) {
        document.getElementById("scanBox").innerHTML = devices;
        console.log(devices);
    }
    function subHandler(data: string) {
        var str = decodeURIComponent(escape(data));
        document.getElementById("dataBox").innerHTML = str;
        console.log(str);
        
    }
    function connectionHandler(x: boolean) {
        if (x) {
            document.getElementById("connectedBox").innerHTML = "Device connected";
            
        } else {
            document.getElementById("connectedBox").innerHTML = "Device not connected";
        }
        console.log("connected:", x);
    }
    async function scanBtn() {
        startScan(function (d) { deviceHandler(d) }, 5000);
    }
    async function connectBtn() {

        let address = "4C:EB:D6:6E:11:32";
        await connect(address, () => console.log('disconnected'));
        getConnectionUpdates(function (x: boolean) { connectionHandler(x) });

    }

    async function disconnectBtn() {       
        await disconnect();
        getConnectionUpdates(function (x: boolean) { connectionHandler(x) });
    }

    async function readBtn() {

        var badstr = await readString(ESPOUT_CHARACTERISTIC_UUID);

        var str = decodeURIComponent(escape(badstr));

        console.log(str);
        //
    }
    async function writeBtn() {
        var x = document.getElementById("writeData").value;
        var str = decodeURIComponent(escape(x));
        await sendString(APPOUT_CHARACTERISTIC_UUID, str, "withoutResponse");
    }

    async function subBtn() {
        subscribeString(ESPOUT_CHARACTERISTIC_UUID, function (d) { subHandler(d) });
    }

    function updateIndex() {
        for (var i = 0; i <= (maxPoints - 1); i++) {
            if (dataPacketList[i]) {
                dataPacketList[i].index = i;
            }
        }
    }
    async function plot() {

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
            .domain([35, 41])
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
            .attr("cy", function (d) { return d.temp + padding / 2 })
            .attr("r", 3)
            .style("fill", "Red")

        // Add the line
        svg.append("path")
            .datum(dataPacketList)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) { return (d.index * ((xMax - padding / 2) / maxPoints) + padding) })
                .y(function (d) { return (d.temp + padding / 2) })
            );

        //text on the points
        svg.selectAll(".text")
            .data(dataPacketList)
            .enter().append("text")
            // .attr("class", "text_on_point")
            .attr("x", function (d) { return (d.index * ((xMax - padding / 2) / maxPoints) + padding); })
            .attr("y", function (d) { return (d.temp + padding / 2); })
            .text(function (d) { return d.packetNumber; });



        // svg.selectAll("svg")
        //     .attr("width:", "100px")
        //     ;


    }
    let response = 'None';


    return (
        /* <p>{avial() ? "true" : "false"}</p> */

        <main class="flex-col justify-content-center content-center h-screen bg-linear-180 from-red-500 to-cyan-500" >
            <div class="justify-self-center h-fit text-center" >
                <h1 class="tracking-wide font-semibold text-3xl" >Vital Sign Monitor</h1>
                <h1 class="text-base" >Hold phone to device to get reading</h1>

                <svg id="myPlot" class="w-full h-96"></svg>
                <button class="w-full h-10 rounded-2xl border-2" id="update-button" onclick={() => {
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
            </div>


            <button class="w-full h-10 rounded-2xl border-2" onclick={() => {
                
                scanBtn();

            }}>Scan</button>

            <button class="w-full h-10 rounded-2xl border-2" onclick={() => {
                document.getElementById("connectedBox")!.innerHTML = "connecting...";
                connectBtn();

            }}>Connect</button>

            <button class="w-full h-10 rounded-2xl border-2" onclick={() => {
                document.getElementById("connectedBox")!.innerHTML = "disconnecting...";
                disconnectBtn();

            }}>Disconnect</button>

            <button class="w-full h-10 rounded-2xl border-2" onclick={() => {
                subBtn();

            }}>Subscribe</button>

            <input class="w-full h-10 rounded-2xl border-2" type="text" id="writeData" value="Send this to BLE device"></input>

            <button class="w-full h-10 rounded-2xl border-2" onclick={() => {
                writeBtn();

            }}>Write data</button>

            <h1 class="tracking-wide font-semibold text-3xl" >BLE Data: </h1>
            <p id="connectedBox" class="tracking-wide font-semibold text-xl" >None</p>
            <p id="dataBox" class="tracking-wide font-semibold text-xl" >None</p>

            <p id="scanBox" class="tracking-wide font-semibold text-xl" >None</p>

        </main>
    );
}

export default App;
