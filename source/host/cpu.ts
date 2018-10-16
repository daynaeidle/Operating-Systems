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
            this.IR = "00";
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.

            _Pcb.PC = this.PC;
            _Pcb.Acc = this.Acc;
            _Pcb.IR = this.IR;
            _Pcb.Xreg = this.Xreg;
            _Pcb.Yreg = this.Yreg;
            _Pcb.Zflag = this.Zflag;


            var opCode = this.fetch(this.PC);
            this.IR = opCode;
            console.log("PC: " + this.PC);
            console.log("Acc: " + this.Acc);
            console.log("IR: " + this.IR);
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
                    console.log("VALUE: " + val);
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
                    val = this.Acc;
                    var hexAddr = String((this.fetch(this.PC + 2))) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    console.log("PARSED HEX ADDRESS:" + address);
                    _MemoryAccessor.writeValue(address, val);
                    console.log(address + ": " + _Memory.mainMem[address]);
                    this.PC += 3;
                    break;
                case("6D"):
                    //add with carry
                    var hexAddr = String((this.fetch(this.PC + 2))) + String(this.fetch(this.PC + 1));
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
                    address = address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
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
                    address = address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
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
                    var hexAddr = String((this.fetch(this.PC + 2))) + String(this.fetch(this.PC + 1));
                    address = parseInt(hexAddr, 16);
                    val = parseInt(this.fetch(address), 16);
                    if (this.Xreg == val){
                        this.Zflag = 1;
                    }else{
                        this.Zflag = 0;
                    }
                    break;
                case("D0"):
                    //DOUBLE CHECK THIS
                    //branch n bytes if zflag = 0
                    if (this.Zflag == 0){
                        this.PC =  Number(parseInt(this.fetch(this.PC + 1), 16));
                    }else{
                        this.PC += 2;
                    }
                    break;
                case("EE"):
                    //incrememnt the value of a byte
                    var hexAddr = String((this.fetch(this.PC + 2))) + String(this.fetch(this.PC + 1));
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
                        _KernelInterruptQueue.enqueue(new Interrupt(OUTPUT_IRQ, this.Yreg));
                    }else if (this.Xreg == 2){
                        address = parseInt(String(this.Yreg), 16);
                        val = parseInt(this.fetch(address), 16);
                        var char = String.fromCharCode(val);
                        _KernelInterruptQueue.enqueue(new Interrupt(OUTPUT_IRQ, char));
                    }
                    break;
                default:
                    var msg = "Not a valid op code.";
                    _KernelInterruptQueue.enqueue(new Interrupt(OPCODE_ERROR_IRQ, msg));
            }
            console.log("IR: " + this.IR);
            console.log("PID: " + _currPID);
            //TSOS.Control.updateCPUTable(this.PC, this.IR, this.Acc, this.Xreg, this.Yreg, this.Zflag);
            //TSOS.Control.updatePCBTable(_currPID, _Pcb.state,  this.PC, this.IR, this.Acc, this.Xreg, this.Yreg, this.Zflag);

        }

    }
}
