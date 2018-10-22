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
            //if resident queue has items in it
            if (_ResidentQueue.getSize() > 0){
                //take the first item off the resident queue and make it the current pcb
                _currPcb = _ResidentQueue.dequeue();
                _currPcb.state = "Running";
            //otherwise
            }else{
                //the the first item off the ready queue and make it pcb
                _currPcb = _ReadyQueue.dequeue();
                _currPcb.state = "Running";
            }
        }


        public schedule(): void{

            //if cpu cycles = quantum.. switch the process
            if (cpuCycles == this.quantum){
                console.log("New process");
                //switch the process
                _currPcb.state = "Ready";
                _ReadyQueue.enqueue(_currPcb);
                cpuCycles = 0;
                _currPcb.init();
                this.getNewProc();
            }else{
                console.log("same process");
            }

        }



    }
}