///<reference path="../globals.ts" />

/* ------------
     CPU.ts

     Requires global.ts.

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public IR: string = "00",
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.IR = "-";
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            _currPcb.state = "Running";
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.

            console.log("CURRENT: " + _currPcb.PID);

            //fetch the opcode, set it to the IR, and decode it
            var opCode = this.fetch(this.PC);
            this.IR = opCode;
            this.decode(String(opCode));
        }

        //fetch a value from memory
        public fetch(memAddress: number) {
            this.isExecuting = true;
            return _MemoryAccessor.readValue(memAddress);

        }

        //decode an opcode
        public decode(opCode: string){
            //find out what the instruction means

            console.log("current opcode: " + opCode);

            var val;
            var address;
            var hexAddr;

            switch(opCode){

                case("A9"):
                    //load the accumulator with a constant
                    //parse the next value in memory as decimal, set to the accumulator and increase program counter by 2
                    val = parseInt(this.fetch(this.PC + 1), 16);
                    this.Acc = val;
                    this.PC += 2;
                    break;
                case("AD"):
                    //load the accumulator from memory
                    //parse the given value in memory as decimal, set to accumulator, and increase PC by 3
                    hexAddr = String((this.fetch(this.PC + 2))) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Acc = val;
                    this.PC += 3;
                    break;
                case ("8D"):
                    //store the accumulator in memory
                    //store accumulator value as hex, parse address, write acc to address, increase PC by 3
                    val = (this.Acc).toString(16).toUpperCase();
                    hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    _MemoryAccessor.writeValue(address, val);
                    this.PC += 3;
                    break;
                case("6D"):
                    //add with carry
                    //parse address in memory, add value at that location to acc and set to acc, increase PC by 3
                    hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Acc = this.Acc + val;
                    this.PC += 3;
                    break;
                case("A2"):
                    //load x register with a constant
                    //parse next value in memory as decimal and set to xreg, increase PC by 2
                    val = parseInt(this.fetch(this.PC + 1),16);
                    this.Xreg = val;
                    this.PC += 2;
                    break;
                case("AE"):
                    //load x register from memory
                    //parse given value in memory as decimal, set to xreg, increase PC by 3
                    hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Xreg = val;
                    this.PC += 3;
                    break;
                case("A0"):
                    //load y register with a constant
                    //parse next value in memory as decimal, set to yreg, increase PC by 2
                    val = parseInt(this.fetch(this.PC + 1), 16);
                    this.Yreg = val;
                    this.PC += 2;
                    break;
                case("AC"):
                    //load y register from memory
                    //parse given value in memory as decimal, set to yreg, increase PC by 3
                    hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Yreg = val;
                    this.PC += 3;
                    break;
                case("EA"):
                    //do nothing - go to next op code
                    this.PC += 1;
                    break;
                case("00"):
                    //break
                    //set executing to false and call kernel exit process
                    console.log(this.IR, " ", _currPcb.IR);
                    console.log("Current pcb pid in 00 ", _currPcb.PID);
                    TSOS.Control.updateCPUTable(this.PC, this.IR, this.Acc.toString(16), this.Xreg.toString(16), this.Yreg.toString(16), this.Zflag.toString(16));
                    TSOS.Control.updatePCBTable(_currPcb.PID, _currPcb.state,  _currPcb.PC, _currPcb.IR, _currPcb.Acc.toString(16), _currPcb.Xreg.toString(16), _currPcb.Yreg.toString(16), _currPcb.Zflag.toString(16), _currPcb.base);
                    _KernelInterruptQueue.enqueue(new Interrupt(COMPLETE_PROC_IRQ, _currPcb.PID));
                    break;
                case("EC"):
                    //compares a byte in memory to the xreg - changes zflag if equal
                    //parse address in memory, get/parse val at that address - if xreg = that value, set zflag to 1 otherwise set zflag to 0, increase PC by 3
                    hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    if (this.Xreg == val){
                        this.Zflag = 1;
                    }else{
                        this.Zflag = 0;
                    }
                    this.PC+=3;
                    break;
                case("D0"):
                    //branch n bytes if zflag = 0
                    //check if z flag = 0
                    if (this.Zflag == 0){
                        //increase program counter by 2(for op codes) + amount at address
                        this.PC +=  (parseInt(this.fetch(this.PC + 1), 16) + 2);
                        //console.log("branch pc: " + this.PC);
                        //if value is larger than allotted space -- wrap around
                        if (this.PC > _limit){
                            var overflow = this.PC - 256;
                            this.PC = overflow;
                            //console.log("branch pc: " + this.PC);
                        }
                    }else{
                        //otherwise increase PC by 2
                        this.PC += 2;
                    }
                    break;
                case("EE"):
                    //incrememnt the value of a byte
                    //parse address in memory and find val at that location -- write val + 1 to memory and increase PC by 3
                    hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    _MemoryAccessor.writeValue(address, val + 1);
                    this.PC += 3;
                    break;
                case("FF"):
                    //system call
                    //01 in xregprint the integer stored in the y register
                    //02 in xreg print the 00 terminated string stored at the y register
                    //if x = 1, output value at yreg(call kernell interrupt)
                    if (this.Xreg == 1){
                        this.PC+=1;
                        _KernelInterruptQueue.enqueue(new Interrupt(OUTPUT_IRQ, String(this.Yreg)));

                    //if x == 2, output value at location from y reg address(call kernel interrupt)
                    }else if (this.Xreg == 2){

                        address = this.Yreg;
                        var char = String.fromCharCode(val);
                        var yString = "";

                        //until a 0 in memory is found
                        while (val != "0"){
                            //get a value at a location in memory
                            val = parseInt(this.fetch(address), 16);
                            //use that val as a char code to get the character
                            char = String.fromCharCode(val);
                            //add that character to yString
                            yString += char;
                            //increase the address
                            address++;
                        }
                        this.PC+=1;
                        _KernelInterruptQueue.enqueue(new Interrupt(OUTPUT_IRQ, yString));

                    //otherwise just increase PC by 1
                    }else{
                        this.PC+=1;
                    }
                    //console.log("sys call ir: " + this.IR);
                    break;
                default:
                    var msg = opCode + " is not a valid op code.";
                    _KernelInterruptQueue.enqueue(new Interrupt(OPCODE_ERROR_IRQ, msg));
            }

            cpuCycles += 1;
            _currPcb.turnaround += 1;
            console.log("Clock cycles: " + cpuCycles);

            //update all variables and display tables
            _currPcb.PC = this.PC;
            _currPcb.Acc = this.Acc;
            _currPcb.IR = this.IR;
            _currPcb.Xreg = this.Xreg;
            _currPcb.Yreg = this.Yreg;
            _currPcb.Zflag = this.Zflag;
            TSOS.Control.updateCPUTable(this.PC,
                                        this.IR,
                                        this.Acc.toString(16).toUpperCase(),
                                        this.Xreg.toString(16).toUpperCase(),
                                        this.Yreg.toString(16).toUpperCase(),
                                        this.Zflag.toString(16).toUpperCase());
            TSOS.Control.updatePCBTable(_currPcb.PID,
                                        _currPcb.state,
                                        _currPcb.PC,
                                        _currPcb.IR,
                                        _currPcb.Acc.toString(16).toUpperCase(),
                                        _currPcb.Xreg.toString(16).toUpperCase(),
                                        _currPcb.Yreg.toString(16).toUpperCase(),
                                        _currPcb.Zflag.toString(16).toUpperCase(),
                                        _currPcb.base);

        }

    }
}
