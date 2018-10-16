///<reference path="../globals.ts" />

/* ------------
     Pcb.ts

     Requires global.ts.


     ------------ */

module TSOS {

    export class Pcb {

        constructor(public PID: number,
                    public base: number,
                    public state: string,
                    public PC: number,
                    public IR: string,
                    public Acc: number,
                    public Xreg: number,
                    public Yreg: number,
                    public Zflag: number) {

        }

        public init(): void {
            this.PID = -1;
            this.base = 0;
            this.state = "ready";
            this.PC = 0;
            this.IR = "00";
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
        }


    }
}