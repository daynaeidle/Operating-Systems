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

            var opcode = fetch();
        }

        public fetch(pid: number) {
            //fetch an instruction to decode from a process

        }

        public decode(opcode: string){
            //find out what the instruction means

            switch(opcode){
                case("A9"):
                    break;
                case("AD"):
                    break;
                case ("8D"):
                    break;
                case("6D"):
                    break;
                case("A2"):
                    break;
                case("AE"):
                    break;
                case("A0"):
                    break;
                case("AC"):
                    break;
                case("EA"):
                    break;
                case("00"):
                    break;
                case("EC"):
                    break;
                case("D0"):
                    break;
                case("EE"):
                    break;
                case("FF"):
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
