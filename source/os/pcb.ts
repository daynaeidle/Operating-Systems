///<reference path="../globals.ts" />

/* ------------
     Pcb.ts

     Requires global.ts.

     Process control block for creating new processes


     ------------ */

module TSOS {

    export class Pcb {

        constructor(public PID: string,
                    public base: number,
                    public state: string,
                    public PC: number,
                    public IR: string,
                    public turnaround: number,
                    public waittime: number,
                    public Acc: number,
                    public Xreg: number,
                    public Yreg: number,
                    public Zflag: number) {

        }

        public init(): void {
            this.PID = "-";
            this.base = 0;
            this.state = "-";
            this.PC = 0;
            this.IR = "-";
            this.turnaround = 0;
            this.waittime = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
        }


    }
}