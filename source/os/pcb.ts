///<reference path="../globals.ts" />

/* ------------
     Pcb.ts

     Requires global.ts.


     ------------ */

module TSOS {

    export class Pcb {

        constructor(public PID: string,
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
            this.PID = "-";
            this.base = 0;
            this.state = "-";
            this.PC = 0;
            this.IR = "-";
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
        }


    }
}