///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />

/* ------------
     Control.ts

     Requires globals.ts.

     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.

     This (and other host/simulation scripts) is the only place that we should see "web" code, such as
     DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

//
// Control Services
//
module TSOS {

    export class Control {

        public static hostInit(): void {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.

            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = <HTMLCanvasElement>document.getElementById('display');

            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");

            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            CanvasTextFunctions.enable(_DrawingContext);   // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.

            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            (<HTMLInputElement> document.getElementById("taHostLog")).value="";

            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            (<HTMLInputElement> document.getElementById("btnStartOS")).focus();


            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === "function") {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }




        }

        public static hostLog(msg: string, source: string = "?"): void {
            // Note the OS CLOCK.
            var clock: number = _OSclock;

            // Note the REAL clock in milliseconds since January 1, 1970.
            var now: number = new Date().getTime();

            // Build the log string.
            var str: string = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " })"  + "\n";

            // Update the log console.
            var taLog = <HTMLInputElement> document.getElementById("taHostLog");
            taLog.value = str + taLog.value;

            //get datetime for task bar
            //Create a date variable
            var dt = new Date().toLocaleString();
            // console.log(dt);
            // Set the datetime and status(global) to the taskbar
            (<HTMLElement> document.getElementById("taskBar")).innerHTML = "<p1>" + dt + " ~ " + _Status + "</p1>";

            // TODO in the future: Optionally update a log database or some streaming service.
        }


        //
        // Host Events
        //
        public static hostBtnStartOS_click(btn): void {
            // Disable the (passed-in) start button...
            btn.disabled = true;

            // .. enable the Halt and Reset buttons ...
            (<HTMLButtonElement>document.getElementById("btnHaltOS")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnReset")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnSingleStep")).disabled = false;


            // .. set focus on the OS console display ...
            document.getElementById("display").focus();

            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new Cpu();  // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init();       //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.

            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new Kernel();
            _Kernel.krnBootstrap();  // _GLaDOS.afterStartup() will get called in there, if configured.

            this.createMemoryTable();



        }

        public static hostBtnHaltOS_click(btn): void {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            // TODO: Is there anything else we need to do here?
        }

        public static hostBtnSingStep_click(btn): void{

            if (singleStepMode == false){
                (<HTMLButtonElement>document.getElementById("btnStep")).disabled = false;
                singleStepMode = true;
            }else{
                (<HTMLButtonElement>document.getElementById("btnStep")).disabled = true;
                singleStepMode = false;
            }
        }

        public static hostBtnStep_click(btn): void{

            if (step == false){
                step = true;
            }else{
                step = false;
            }


        }

        public static hostBtnReset_click(btn): void {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        }

        public static createMemoryTable(): void{
            var row = [];
            var table = "";
            var hexVar = 0;

            for (var i = 0; i < _Memory.mainMem.length; i++){


                row.push(_Memory.mainMem[i]);

                if (row.length == 8){
                    var html =
                    `<tr>` +
                        `<td>0x${hexVar.toString(16).toUpperCase()}</td>`+
                        `<td>${row[0]}</td>`+
                        `<td>${row[1]}</td>`+
                        `<td>${row[2]}</td>`+
                        `<td>${row[3]}</td>`+
                        `<td>${row[4]}</td>`+
                        `<td>${row[5]}</td>`+
                        `<td>${row[6]}</td>`+
                        `<td>${row[7]}</td>`+
                    `</tr>`

                    hexVar += 8;
                    table += html;
                    row = [];

                }
            }

            document.getElementById('memTable').innerHTML = table;

        }


        public static updateCPUTable(pc, ir, acc, x, y, z): void{

            (<HTMLElement> document.getElementById("cpu-pc")).innerHTML = String(pc);
            (<HTMLElement> document.getElementById("cpu-ir")).innerHTML = String(ir);
            (<HTMLElement> document.getElementById("cpu-acc")).innerHTML = String(acc);
            (<HTMLElement> document.getElementById("cpu-x")).innerHTML = String(x);
            (<HTMLElement> document.getElementById("cpu-y")).innerHTML = String(y);
            (<HTMLElement> document.getElementById("cpu-z")).innerHTML = String(z);


        }

        public static updatePCBTable(pid, state, pc, ir, acc, x, y, z, base){


            if (base == 0){
                (<HTMLElement> document.getElementById("pcb1-pid")).innerHTML = String(pid);
                (<HTMLElement> document.getElementById("pcb1-state")).innerHTML = String(state);
                (<HTMLElement> document.getElementById("pcb1-pc")).innerHTML = String(pc);
                (<HTMLElement> document.getElementById("pcb1-ir")).innerHTML = ir;
                (<HTMLElement> document.getElementById("pcb1-acc")).innerHTML = String(acc);
                (<HTMLElement> document.getElementById("pcb1-x")).innerHTML = String(x);
                (<HTMLElement> document.getElementById("pcb1-y")).innerHTML = String(y);
                (<HTMLElement> document.getElementById("pcb1-z")).innerHTML = String(z);
            } else if (base == 256){
                (<HTMLElement> document.getElementById("pcb2-pid")).innerHTML = String(pid);
                (<HTMLElement> document.getElementById("pcb2-state")).innerHTML = String(state);
                (<HTMLElement> document.getElementById("pcb2-pc")).innerHTML = String(pc);
                (<HTMLElement> document.getElementById("pcb2-ir")).innerHTML = ir;
                (<HTMLElement> document.getElementById("pcb2-acc")).innerHTML = String(acc);
                (<HTMLElement> document.getElementById("pcb2-x")).innerHTML = String(x);
                (<HTMLElement> document.getElementById("pcb2-y")).innerHTML = String(y);
                (<HTMLElement> document.getElementById("pcb2-z")).innerHTML = String(z);
            }else{
                (<HTMLElement> document.getElementById("pcb3-pid")).innerHTML = String(pid);
                (<HTMLElement> document.getElementById("pcb3-state")).innerHTML = String(state);
                (<HTMLElement> document.getElementById("pcb3-pc")).innerHTML = String(pc);
                (<HTMLElement> document.getElementById("pcb3-ir")).innerHTML = ir;
                (<HTMLElement> document.getElementById("pcb3-acc")).innerHTML = String(acc);
                (<HTMLElement> document.getElementById("pcb3-x")).innerHTML = String(x);
                (<HTMLElement> document.getElementById("pcb3-y")).innerHTML = String(y);
                (<HTMLElement> document.getElementById("pcb3-z")).innerHTML = String(z);
            }
        }


        public static loadDiskTable(){
            /*
            var table = (<HTMLTableElement> document.getElementById("diskTable"));

            var rowNum = 0;

            for (var i = 0; i < _krnFileSystem.track; i++){
                for (var j = 0; j < _krnFileSystem.sector; j++){
                    for (var k = 0; k < _krnFileSystem.block; ){
                        var tsb = i.toString() + j.toString() + k.toString();
                        var tsbString = i + ":" + j + ":" + k;

                        var row = table.insertRow(rowNum);

                        var tsbDisplay = row.insertCell(0);
                        tsbDisplay.innerHTML = tsbString;

                        var currTsb = JSON.parse(sessionStorage.getItem(tsb));

                        var availableBit = row.insertCell(1);
                        availableBit.innerHTML = currTsb[0];

                        var pointer = row.insertCell(2);
                        pointer.innerHTML = currTsb[1] + ":" + currTsb[2] + ":" + currTsb[3];

                        var data = row.insertCell(3);
                        var dataVal = "";

                        for (var a = 4; a < currTsb.length; a++){
                            dataVal += currTsb[a];
                        }

                        data.innerHTML = dataVal;

                        rowNum++;
                    }
                }
            }*/



        }
    }

}
