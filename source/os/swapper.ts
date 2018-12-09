///<reference path="../globals.ts" />

module TSOS {

    export class Swapper {

        //take in pid and base of the process being swapped into disk as arguments
        public swapProcess(pid, base){

            var limit = 256;

            //get filename based on pid
            var filename = "process:" + _currPcb.PID;
            console.log(filename);

            //gets program and clears lines along the way
            var diskProgram = _krnFileSystem.getProcessFromDisk(filename);

            //clear the filename line
            var tsb = _krnFileSystem.getTsb(filename);
            console.log(tsb);
            var block = JSON.parse(sessionStorage.getItem(tsb));
            block = _krnFileSystem.clearLine(tsb);
            sessionStorage.setItem(tsb, JSON.stringify(block));

            //grab process from memory
            var len = _ReadyQueue.getSize();
            var memProgram = [];

            //initialize section of main mem to "00" while looping
            for (var i = 0; i < limit; i++){
                memProgram[i] = _Memory.mainMem[i + base];
                _Memory.mainMem[i + base] = "00";
            }


            //and trim the ending zeroes off
            memProgram = this.trimZeroes(memProgram);
            diskProgram = this.trimZeroes(diskProgram);

            console.log("disk");
            console.log(diskProgram);

            console.log("mem");
            console.log(memProgram);


            //set disk program to main memory
            for (var j = 0; j < diskProgram.length; j++){
                _Memory.mainMem[j + base] = diskProgram[j];
            }

            //write memprogram to disk
            _krnFileSystem.loadProcessToDisk(pid, memProgram);

        }

        public trimZeroes(program){

            var trimmedProg = [];

            for (var i = 0; i < program.length; i++){
                if ((program[i] == "00") && (program[i+1] == "00")){
                    break;
                }else{
                    trimmedProg[i] = program[i];
                }
            }

            return trimmedProg;

        }


    }
}
