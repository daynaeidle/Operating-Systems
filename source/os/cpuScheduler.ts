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
                console.log("switching curr pcb in get new proc - scheduler");
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
                console.log("IN SCHEDULE- ready queue size: " + _ReadyQueue.getSize());
                if (_schedule == "rr"){
                    this.roundRobin();
                }else if (_schedule == "fcfs"){
                    this.fcfs();
                }else{
                    this.priority();
                }
            }



        }

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

        public fcfs(): void{

            this.quantum = 2000;

            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("New process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                }else{
                    console.log("same process");
                }
            }

        }

        public priority(): void{

            this.quantum = 2000;

            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("new process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                }else{
                    console.log("same process");
                }

            }

        }

        public sortReadyQueue(): void{

            //sort it so high priority processes (low numbers) are in the front

            var first;
            var second;
            var counter = 1;
            var len = _ReadyQueue.getSize();

            first = _ReadyQueue.dequeue();

            while (counter < len){
                second = _ReadyQueue.dequeue();

                if (first.priority < second.priority){
                    //add first back to the ready queue so it will end up at the front
                    _ReadyQueue.enqueue(first);
                    //set first to second so second can become the new comparison pcb
                    first = second;

                }else if (first.priority > second.priority){
                    //add second back to ready queue so it will end up at the front
                    _ReadyQueue.enqueue(second);

                }else{
                    //to break equal ties, use fcfs -- first was there first so add that back to the ready queue
                    _ReadyQueue.enqueue(first);
                }

                counter++;
            }

            _ReadyQueue.enqueue(first);

            //check what it looks like
            for (var i = 0; i < len; i++){
                var temp = _ReadyQueue.dequeue();
                console.log(temp.priority);
                _ReadyQueue.enqueue(temp);
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