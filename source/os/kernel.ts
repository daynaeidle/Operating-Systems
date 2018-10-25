///<reference path="../globals.ts" />
///<reference path="queue.ts" />

/* ------------
     Kernel.ts

     Requires globals.ts
              queue.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            // Initialize the console.
            _Console = new Console();          // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            //
            // ... more?
            //
            //memory manager
            _MemoryManager	=	new	MemoryManager();
            _CPU	=	new	Cpu();
            _CPU.init();
            _Memory	=	new	Memory();
            _Memory.init();
            _MemoryAccessor	=	new	MemoryAccessor();
            _CpuScheduler	=	new	cpuScheduler();


            _currPcb = new Pcb("-", 0, "Ready", 0, "-", 0, 0, 0, 0, 0, 0);
            _currPcb.init();

            _ResidentQueue = new Queue();
            _ReadyQueue = new Queue();


            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                           */

            // Check for an interrupt, are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting) {// If there are no interrupts then run one CPU cycle if there is anything being processed. {
                if (singleStepMode == true){
                    if (step == true){
                        _CPU.cycle();
                        step = false;
                    }//else{
                        //console.log("do nothing");
                    //}

                }else{
                    _CPU.cycle();
                }

            } else {                      // If there are no interrupts and there is nothing being executed then just be idle. {
                this.krnTrace("Idle");
            }

            TSOS.Control.createMemoryTable();
        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();              // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case OPCODE_ERROR_IRQ:
                    _StdOut.putText(params);

                    break;
                case OUTPUT_IRQ:
                    _StdOut.putText(params);
                    break;
                case COMPLETE_PROC_IRQ:
                    this.exitProcess(params);
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile

        //create a new process
        public createProcess(base: number){

            //create a new process control block based on base of program in memory
            var newProcess = new Pcb(_Pid.toString(), base, "Resident", 0, "-", 0, 0, 0, 0, 0, 0);

            //update pcb table
            TSOS.Control.updatePCBTable(newProcess.PID, newProcess.state,  newProcess.PC, newProcess.IR, newProcess.Acc, newProcess.Xreg, newProcess.Yreg, newProcess.Zflag);

            //update pid
            _Pid++;

            //add new process to resident queue
            _ResidentQueue.enqueue(newProcess);

            for (var i = 0; i < _ReadyQueue.q.length; i++){
                console.log(_ReadyQueue.q[i]);
            }


            //print to test
            for (var i = 0; i < _ResidentQueue.q.length; i++){
                console.log(_ResidentQueue.q[i]);
            }
        }

        //execute a specified process
        public executeProcess(pid: number){
            //find the correct process in the resident queue based on pid
            for (var i =0; i < _ResidentQueue.getSize(); i++){
                //set it to a global pcb variable
                var _currPcb = _ResidentQueue.dequeue();
                console.log("regular execution pcb: " + _currPcb);
                if (_currPcb.PID == pid){
                    //set a global pid, change the state and set executing to true; break out of loop
                    _currPID = pid.toString();
                    _currPcb.state = "Running";
                    _CPU.isExecuting = true;
                    _ReadyQueue.enqueue(_currPcb);
                    break;
                }
            }
        }

        //execute all processes
        public executeAll(){
            //call the scheduler
            runall = true;
            var _currPcb = _ResidentQueue.dequeue();
            console.log("IN kernel - curr PCB:" + _currPcb.PID);
            _currPcb.state = "Running";
            _CPU.isExecuting = true;
            //_CpuScheduler.schedule();

        }

        //exit a process
        public exitProcess(pid:string){
            console.log("Process exited");

            _StdOut.advanceLine();
            _StdOut.putText("Turnaround Time: " + _currPcb.turnaround);
            _StdOut.advanceLine();
            _StdOut.putText("Wait Time: " + _currPcb.waittime);

            //advance line and put prompt
            _StdOut.advanceLine();
            _OsShell.putPrompt();

            //set state to terminated and executing to false
            _currPcb.state = "Terminated";
            _CPU.isExecuting = false;

            for (var i = 0; i < _ReadyQueue.getSize(); i++){
                var temp = _ReadyQueue.dequeue();
                if (_currPcb.PID == temp.PID){
                    break;
                }else{
                    _ReadyQueue.enqueue(temp);
                }
            }

            //reset main mem using base
            var base = _currPcb.base;
            for (var j = base; j < base + 255; j++) {
                _Memory.mainMem[j] = "00";
            }

            //reset pcb and cpu variables
            _currPcb.init();

            _CPU.PC = 0;
            _CPU.IR = "-";
            _CPU.Acc = 0;
            _CPU.Xreg = 0;
            _CPU.Yreg = 0;
            _CPU.Zflag = 0;
            _currPID = "-";

            TSOS.Control.updateCPUTable(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);

        }

        public killProcess(pid: number){

            var temp;

            for (var i = 0; i < _ResidentQueue.getSize(); i++){
                temp = _ResidentQueue.dequeue();
                if (pid == temp.PID){
                    break;
                }else{
                    _ResidentQueue.enqueue(temp);
                }
            }

            for (var i = 0; i < _ReadyQueue.getSize(); i++){
                temp = _ReadyQueue.dequeue();
                if (pid == temp.PID){
                    break;
                }else{
                    _ReadyQueue.enqueue(temp);
                }
            }


            _StdOut.advanceLine();
            _StdOut.putText("PID: " + temp.pid);
            _StdOut.advanceLine();
            _StdOut.putText("Turnaround Time: " + temp.turnaround);
            _StdOut.advanceLine();
            _StdOut.putText("Wait Time: " + temp.waittime);

            _CPU.isExecuting = false;

            //reset main mem using base
            var base = _currPcb.base;
            for (var j = base; j < base + 255; j++) {
                _Memory.mainMem[j] = "00";
            }


            _CPU.PC = 0;
            _CPU.IR = "-";
            _CPU.Acc = 0;
            _CPU.Xreg = 0;
            _CPU.Yreg = 0;
            _CPU.Zflag = 0;
            _currPID = "-";

            TSOS.Control.updateCPUTable(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);


        }


        public clearMemory(){
            for (var i = 0; i < 768; i++){
                _Memory.mainMem[i] = "00";
            }
        }




        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
            this.krnShutdown();
        }
    }
}
