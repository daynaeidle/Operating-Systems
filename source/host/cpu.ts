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
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.

            var opcode = this.fetch(this.PC);
        }

        public fetch(memAddress: number) {
            this.isExecuting = true;
            //fetch an instruction to decode from a process
            return _MemoryAccessor.readMemory(memAddress);

        }

        public decode(opcode: string){
            //find out what the instruction means

            var val;
            var address;

            switch(opcode){

                case("A9"):
                    //load the accumulator with a constant
                    val = this.fetch(this.PC + 1);
                    this.Acc = val;
                    this.PC += 2;
                    break;
                case("AD"):
                    //load the accumulator from memory
                    address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    val = this.fetch(address);
                    this.Acc = val;
                    this.PC += 3;
                    break;
                case ("8D"):
                    //store the accumulator in memory
                    val = this.Acc;
                    address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    _MemoryAccessor.writeValue(address, val);
                    this.PC += 3;
                    break;
                case("6D"):
                    //add with carry
                    address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    val = this.fetch(address);
                    this.Acc = this.Acc + val;
                    this.PC += 3;
                    break;
                case("A2"):
                    //load x register with a constant
                    val = this.fetch(this.PC + 1);
                    this.Xreg = val;
                    this.PC += 2;
                    break;
                case("AE"):
                    //load x register from memory
                    address = address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    val = this.fetch(address);
                    this.Xreg = val;
                    this.PC += 3;
                    break;
                case("A0"):
                    //load y register with a constant
                    val = this.fetch(this.PC + 1);
                    this.Yreg = val;
                    this.PC += 2;
                    break;
                case("AC"):
                    //load y register from memory
                    address = address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    val = this.fetch(address);
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
                    break;
                case("EC"):
                    //compares a byte in memory to the xreg - changes zflag if equal
                    address = address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    val = this.fetch(address);
                    if (this.Xreg == val){
                        this.Zflag = 1;
                    }else{
                        this.Zflag = 0;
                    }
                    break;
                case("D0"):
                    //branch n bytes if zflag = 0
                    if (this.Zflag == 0){
                        this.PC = = this.fetch(this.PC + 1);
                        this.PC += 2;
                    }else{
                        this.PC += 2;
                    }
                    break;
                case("EE"):
                    //incrememnt the value of a byte
                    address = address = parseInt((this.fetch(this.PC+2).toString(), this.fetch(this.PC+1).toString()));
                    val = this.fetch(address);
                    _MemoryAccessor.writeValue(address, val + 1);
                    this.PC += 3;
                    break;
                case("FF"):
                    //system call
                    //01 in xregprint the integer stored in the y register
                    //02 in xreg print the 00 terminated string stored at the y register
                    if (this.Xreg == 1){
                        console.log(this.Yreg);
                    }else if (this.Xreg == 2){
                        console.log((this.Yreg).toString);
                    }
                    break;
                default:
                    console.log("Not a valid op code");
            }

        }

        public execute(){
            //execute that instruction

        }
    }
}
