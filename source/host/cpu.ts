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

            /*_currPcb.PC = this.PC;
            _currPcb.Acc = this.Acc;
            _currPcb.IR = this.IR;
            _currPcb.Xreg = this.Xreg;
            _currPcb.Yreg = this.Yreg;
            _currPcb.Zflag = this.Zflag;
            TSOS.Control.updateCPUTable(this.PC, this.IR, this.Acc, this.Xreg, this.Yreg, this.Zflag);
            TSOS.Control.updatePCBTable(_currPID, _currPcb.state,  _currPcb.PC, _currPcb.IR, _currPcb.Acc, _currPcb.Xreg, _currPcb.Yreg, _currPcb.Zflag);*/



            var opCode = this.fetch(this.PC);
            this.IR = opCode;
            this.decode(String(opCode));
        }

        public fetch(memAddress: number) {
            this.isExecuting = true;
            return _MemoryAccessor.readValue(memAddress);

        }

        public decode(opCode: string){
            //find out what the instruction means

            var val;
            var address;

            switch(opCode){

                case("A9"):
                    //load the accumulator with a constant
                    val = parseInt(this.fetch(this.PC + 1), 16);
                    this.Acc = val;
                    this.PC += 2;
                    break;
                case("AD"):
                    //load the accumulator from memory
                    var hexAddr = String((this.fetch(this.PC + 2))) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Acc = val;
                    this.PC += 3;
                    break;
                case ("8D"):
                    //store the accumulator in memory
                    val = (this.Acc).toString(16).toUpperCase();
                    var hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    _MemoryAccessor.writeValue(address, val);
                    this.PC += 3;
                    break;
                case("6D"):
                    //add with carry
                    var hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Acc = this.Acc + val;
                    this.PC += 3;
                    break;
                case("A2"):
                    //load x register with a constant
                    val = parseInt(this.fetch(this.PC + 1),16);
                    this.Xreg = val;
                    this.PC += 2;
                    break;
                case("AE"):
                    //load x register from memory
                    var hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Xreg = val;
                    this.PC += 3;
                    break;
                case("A0"):
                    //load y register with a constant
                    val = parseInt(this.fetch(this.PC + 1), 16);
                    this.Yreg = val;
                    this.PC += 2;
                    break;
                case("AC"):
                    //load y register from memory
                    var hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    this.Yreg = val;
                    this.PC += 3;
                    break;
                case("EA"):
                    //do nothing
                    this.PC += 1;
                    break;
                case("00"):
                    //break
                    this.isExecuting = false;
                    _Kernel.exitProcess(_currPID);
                    break;
                case("EC"):
                    //compares a byte in memory to the xreg - changes zflag if equal
                    var hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
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
                    if (this.Zflag == 0){
                        this.PC +=  (parseInt(this.fetch(this.PC + 1), 16) + 2);
                        console.log("branch pc: " + this.PC);
                        if (this.PC > _currPcb.base + 255){
                            var overflow = this.PC - (_currPcb.base + 256);
                            this.PC = overflow + _currPcb.base;
                            console.log("branch pc: " + this.PC);
                        }
                    }else{
                        this.PC += 2;
                    }
                    break;
                case("EE"):
                    //incrememnt the value of a byte
                    var hexAddr = String(this.fetch(this.PC + 2)) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    _MemoryAccessor.writeValue(address, val + 1);
                    this.PC += 3;
                    break;
                case("FF"):
                    //system call
                    //01 in xregprint the integer stored in the y register
                    //02 in xreg print the 00 terminated string stored at the y register
                    if (this.Xreg == 1){
                        console.log("y reg: " + this.Yreg);
                        _KernelInterruptQueue.enqueue(new Interrupt(OUTPUT_IRQ, String(this.Yreg)));
                        this.PC+=1;
                    }else if (this.Xreg == 2){

                        address = this.Yreg;
                        //console.log("Yreg address: " + address);

                        var char = String.fromCharCode(val);
                        var yString = "";

                        while (val != "0"){
                            val = parseInt(this.fetch(address), 16);

                            //console.log("val from address: " + val);
                            char = String.fromCharCode(val);
                            //console.log("Char from val: " + char);
                            yString += char;
                            //console.log(yString);
                            address++;
                        }
                        _KernelInterruptQueue.enqueue(new Interrupt(OUTPUT_IRQ, yString));
                        this.PC+=1;
                    }
                    break;
                default:
                    var msg = "Not a valid op code.";
                    _KernelInterruptQueue.enqueue(new Interrupt(OPCODE_ERROR_IRQ, msg));
            }

            _currPcb.PC = this.PC;
            _currPcb.Acc = this.Acc;
            _currPcb.IR = this.IR;
            _currPcb.Xreg = this.Xreg;
            _currPcb.Yreg = this.Yreg;
            _currPcb.Zflag = this.Zflag;
            TSOS.Control.updateCPUTable(this.PC, this.IR, this.Acc.toString(16), this.Xreg.toString(16), this.Yreg.toString(16), this.Zflag.toString(16));
            TSOS.Control.updatePCBTable(_currPID, _currPcb.state,  _currPcb.PC, _currPcb.IR, _currPcb.Acc.toString(16), _currPcb.Xreg.toString(16), _currPcb.Yreg.toString(16), _currPcb.Zflag.toString(16));

        }

    }
}
