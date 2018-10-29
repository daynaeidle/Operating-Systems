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
            /*if (_ResidentQueue.getSize() > 0){
                //take the first item off the resident queue and make it the current pcb
                _currPcb = _ResidentQueue.dequeue();
                _currPcb.state = "Running";
            //otherwise
            }else{
                //the the first item off the ready queue and make it pcb
                _currPcb = _ReadyQueue.dequeue();
                _currPcb.state = "Running";
            }*/

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

            console.log("top of ready queue");
            if (_ReadyQueue.getSize() != 0){

                for (var i = 0; i < _ReadyQueue.getSize(); i++){
                    console.log(_ReadyQueue.q[i]);
                }

            }

            console.log("bottom of ready queue");


            //if cpu cycles = quantum.. switch the process
            if (_ReadyQueue.getSize() > 0){
                if (cpuCycles >= this.quantum){
                    console.log("New process");
                    _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, _currPcb));
                    //switch the process
                    /*_currPcb.state = "Ready";
                    TSOS.Control.updatePCBTable(_currPcb.PID,
                                                _currPcb.state,
                                                _currPcb.PC,
                                                _currPcb.IR,
                                                _currPcb.Acc.toString(16).toUpperCase(),
                                                _currPcb.Xreg.toString(16).toUpperCase(),
                                                _currPcb.Yreg.toString(16).toUpperCase(),
                                                _currPcb.Zflag.toString(16).toUpperCase());
                    _ReadyQueue.enqueue(_currPcb);
                    cpuCycles = 0;
                    this.getNewProc();
                    this.setCPU();*/
                }else{
                    console.log("same process");
                }

            }



        }

        public updateWaitAndTurnaround(): void{

            var readyLength = _ReadyQueue.getSize();

            for (var i = 0; i < readyLength; i++){

                var proc = _ReadyQueue.q[i];
                console.log("wait and turnaround pid: " + proc.PID);

                proc.turnaround += 1;
                proc.waittime +=1;
            }
        }





    }
}