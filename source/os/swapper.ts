///<reference path="../globals.ts" />

module TSOS {

    export class Swapper {

        public swapProcess(base){

            //get filename based on pid
            var filename = "process:" + _currPcb.PID;

            //gets program and clears lines along the way
            var diskProgram = _krnFileSystem.getProcessFromDisk(filename);

            //clear the filename line
            var tsb = _krnFileSystem.getTsb(filename);
            var block = JSON.parse(sessionStorage.getItem(tsb));
            block = _krnFileSystem.clearline(tsb);
            sessionStorage.setItem(tsb, JSON.stringify(block));



        }


    }
}
