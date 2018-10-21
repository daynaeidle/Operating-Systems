///<reference path="../globals.ts" />

/* ------------
     cpuScheduler.ts

     Requires global.ts.

     Process control block for creating new processes


     ------------ */

module TSOS {

    export class cpuScheduler {

        constructor(public quantum: number = 5,
                    public readyLength: number,
                    public procIndex: number = 0) {

        }

        public init(): void {

        }


        public getNewProc(){
            //if resident queue has items in it
            if (_ResidentQueue.getSize() > 0){
                //take the first item off the resident queue and make it the current pcb
                _currPcb = _ResidentQueue.dequeue();
            //otherwise
            }else{
                //the the first item off the ready queue and make it pcb
                _currPcb = _ReadyQueue.dequeue();
            }
        }


        public schedule(){

            //if cpu cycles = quantum.. switch the process

            if (cpuCycles == this.quantum){
                //switch the process
                _ReadyQueue.enqueue(_currPcb);
                this.getNewProc();
            }else{
                //continue with the same process
            }

        }


    }
}