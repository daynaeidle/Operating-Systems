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
            if (_ReadyQueue.getSize() > 0){
                //console.log("switching curr pcb in get new proc - scheduler");
                _currPcb = _ReadyQueue.dequeue();
                _currPcb.state = "Running";
            }


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

            if (_ReadyQueue.getSize() > 0){
                //console.log("IN SCHEDULE- ready queue size: " + _ReadyQueue.getSize());
                if (_schedule == "rr"){
                    this.roundRobin();
                }else if (_schedule == "fcfs"){
                    this.fcfs();
                }else{
                    this.priority();
                }
            }



        }

        //schedule based on quantum
        public roundRobin(): void{

            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("New process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                }else{
                    console.log("same process");
                }
            }

        }

        //schedule based on fcfs
        public fcfs(): void{

            //set quantum to high number so that process that gets there first can just do its thing
            //most likely will take less than 3000 cycles
            this.quantum = 3000;

            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("New process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                }else{
                    console.log("same process");
                }
            }

        }

        //schedule based on priority
        public priority(): void{

            this.quantum = 3000;

            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("new process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                }else{
                    console.log("same process");
                }

            }

        }

        //sort the ready queue by priority
        public sortReadyQueue(): void{

            var len = _ReadyQueue.getSize();
            var tempList = [];

            //add elements of ready queue to tempList
            for (var i = 0; i < len; i++){
                tempList[i] = _ReadyQueue.dequeue();
            }

            //sort templist by priority using sort function
            tempList.sort((a,b)=>a.priority-b.priority);

            //add the elements of tempList back to readyqueue
            for (var l = 0; l < len; l++){
                _ReadyQueue.enqueue(tempList[l]);
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