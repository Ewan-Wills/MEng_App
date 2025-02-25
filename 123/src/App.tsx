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
    const deviceName = "EW-ESP"
    const deviceAddress = "4C:EB:D6:6E:11:32";
    const ESPOUT_CHARACTERISTIC_UUID = "cb6079df-c22b-4057-a25a-54cea28247e5";
    const APPOUT_CHARACTERISTIC_UUID = "5025585f-5363-43d9-888b-2ab9e77096ed";

    var deviceFound: boolean;
    var connected: Number;
    var subscribed: Number;
    connected = -1;//-1 is not connected, 0 is attempting and 1 is connected
    subscribed = -1; 
    deviceFound = false;
    // const ESPaddress:string = "4CEBD66E1132";



    function scanDeviceHandler(devices: BleDevice[]) {
        deviceFound = false;
        for (let i = 0; i < devices.length; i++) {

            if (devices[i].name == deviceName) {
                //console.log(devices[i]);
                deviceFound = true;
                stopScan();
                if (connected == -1) {
                    connected = 0;
                    //console.log("New conn handler");
                    connectBtn();
                };
                break;
            }
        }
    };
    function scanUpdateHandler(scanning: boolean) {
        
        if (deviceFound == true) {
            //document.getElementById("scanBox")!.innerHTML = "Device found, attempting to connect...";
            if (connected == 1) {
                //document.getElementById("scanBox")!.innerHTML = "Device connected";
            }
        } else {
            if (scanning == false) {
                //document.getElementById("scanBox")!.innerHTML = "Device not found. Try again";
            }

            if (scanning == true) {
                //document.getElementById("scanBox")!.innerHTML = "Searching for device...";
            }
        }

    }
    function subHandler(data: string) {
        //console.log("New sub handler");
        var str = decodeURIComponent(escape(data));
        document.getElementById("dataBox")!.innerHTML = str;
        var thisDataPacket: DataPacket = {
            index: 0,
            packetNumber: numPoints,
            time: Date.now().toString(), // TODO: what you need to do
            //value between 28 and 42. rand()*14 = 0 -> 14, +28 => 28->42
            temp: parseInt(str)
        }
        plot(thisDataPacket);

    }
    async function connectionHandler(x: boolean) {
        //console.log("New conn handler");
        if (x) {
            if (connected==-1){
                console.log("new connection");
                document.getElementById("connectBtn")!.innerHTML = 'Disconnect';
                document.getElementById("subBtn")!.style.visibility  = 'visible';
            }
            connected = 1;
            //document.getElementById("scanBox")!.innerHTML = "Device connected";

        } else {
            connected = -1;
            //document.getElementById("scanBox")!.innerHTML = "Device not connected";

            document.getElementById("connectBtn")!.innerHTML = "Connect";
            document.getElementById("subBtn")!.style.visibility  = 'hidden';
        }

        
    }
    async function scanBtn() {
        getScanningUpdates(function (d) { scanUpdateHandler(d) });

        startScan(function (d) { scanDeviceHandler(d) }, 2000);

    }
    function connectBtn() {
        console.log("Attempting to connect to", deviceAddress);
        getConnectionUpdates(function (x: boolean) { connectionHandler(x) });
        connect(deviceAddress, () => {
            console.log('disconnected');
            //document.getElementById("scanBox").innerHTML = "Disconnected"; 
        });
    }

    async function disconnectBtn() {
        connected = -1;
        subscribed=-1;
        unsubscribe(ESPOUT_CHARACTERISTIC_UUID);
        await disconnect();

    }

    async function readBtn() {

        var badstr = await readString(ESPOUT_CHARACTERISTIC_UUID);

        var str = decodeURIComponent(escape(badstr));

        //console.log(str);
        //
    }
    async function writeBtn() {
        var x = document.getElementById("writeData")!.value;
        var str = decodeURIComponent(escape(x));
        await sendString(APPOUT_CHARACTERISTIC_UUID, str, "withoutResponse");
    }

    async function subBtn() {
        if (subscribed==-1){
            subscribed=1;
            subscribeString(ESPOUT_CHARACTERISTIC_UUID, function (d) { subHandler(d) });
        }else{
            
        }
    }

    function updateIndex() {
        for (var i = 0; i <= (maxPoints - 1); i++) {
            if (dataPacketList[i]) {
                dataPacketList[i].index = i;
            }
        }
    }
    async function plot(dataPacket:DataPacket) {
        if (!dataPacket){
            var thisDataPacket: DataPacket = {
                index: 0,
                packetNumber: numPoints,
                time: Date.now().toString(), // TODO: what you need to do
                //value between 28 and 42. rand()*14 = 0 -> 14, +28 => 28->42
                temp: ((Math.random() * 14) + 28)
            }
            dataPacketList.push(thisDataPacket);
        }

        else{
            dataPacketList.push(dataPacket);
        }
        


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
            .domain([28, 42])
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
            .attr("cy", function (d) { return (((-(d.temp) + 28) * yMax / 14 + yMax + padding / 2)) }) // what the fuck have i done. This was mostly trial and error
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
                .y(function (d) { return ((-(d.temp) + 28) * yMax / 14 + yMax + padding / 2); })
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
        /* <p>{avial() ? "true" : "false"}</p> */

        <main class="flex-col justify-content-center content-center h-screen bg-linear-180 from-red-500 to-cyan-500" >
            <div class="justify-self-center h-fit text-center" >
                <h1 class="tracking-wide font-semibold text-3xl" >Vital Sign Monitor</h1>
                <h1 class="text-base" >Hold phone to device to get reading</h1>

                <svg id="myPlot" class="w-full h-96"></svg>

            </div>

            <button class="w-full h-10 rounded-2xl border-2" id="update-button" onclick={() => {
                    plot(null);
            }}>Add Random Point to Graph</button>

            <button id="connectBtn" class=" w-full h-10 rounded-2xl border-2" onclick={() => {
                document.getElementById("connectBtn")!.innerHTML = 'Connecting...';
                if(connected==-1){
                    scanBtn();
                }else if(connected==1){
                    disconnectBtn();
                }

            }}>Connect</button>

 

            <button style="visibility :hidden;"  class="w-full h-10 rounded-2xl border-2"  id="subBtn" onclick={() => {
                subBtn();

            }}>Subscribe</button>

            <input class="w-full h-10 rounded-2xl border-2" type="text" id="writeData" value="Send this to BLE device"></input>

            <button class="w-full h-10 rounded-2xl border-2" onclick={() => {
                writeBtn();

            }}>Write data</button>

            <h1 class="tracking-wide font-semibold text-3xl" >BLE Data: </h1>
            {/* <p id="connectedBox" class="tracking-wide font-semibold text-xl" >None</p> */}
            <p id="dataBox" class="tracking-wide font-semibold text-xl" >None</p>

            {/* <p id="scanBox" class="tracking-wide font-semibold text-xl" >None</p> */}

        </main>
    );
}

export default App;
