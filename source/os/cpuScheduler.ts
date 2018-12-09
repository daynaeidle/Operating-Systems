///<reference path="../globals.ts" />

/* ------------
     cpuScheduler.ts

     Requires global.ts.

     Process control block for creating new processes


     ------------ */

module TSOS {

    export class cpuScheduler {

        public quantum: number = 6;
        public readyLength: number;
        public procIndex: number = 0;


        public init(): void {

        }


        public getNewProc(): void{
            _currPcb = _ReadyQueue.dequeue();
            _currPcb.state = "Running";

        }

        public setCPU(): void{
            _CPU.PC = _currPcb.PC;
            _CPU.Acc = _currPcb.Acc;
            _CPU.IR = _currPcb.IR;
            _CPU.Xreg = _currPcb.Xreg;
            _CPU.Yreg = _currPcb.Yreg;
            _CPU.Zflag = _currPcb.Zflag;
        }


        public schedule(): void{

            //if cpu cycles = quantum.. switch the process
            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("New process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                }else{
                    console.log("same process");
                }
            }
        }

        public updateWaitAndTurnaround(): void{

            var readyLength = _ReadyQueue.getSize();

            for (var i = 0; i < readyLength; i++){

                var proc = _ReadyQueue.q[i];

                proc.turnaround += 1;
                proc.waittime +=1;
            }
        }

    }
}