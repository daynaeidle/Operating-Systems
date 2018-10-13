///<reference path="../globals.ts" />

module TSOS {

    export class MemoryManager {

        public base1: number = 0;
        public base2: number = 256;
        public base3: number = 512;
        public limitReg: number = 255;

        public loadMem(userProgram){
            console.log("base 1: " + this.base1);



            console.log("first element of memory: " + _Memory.mainMem[this.base1]);

            if (_Memory.mainMem[this.base1] == "00"){
                for (var i = 0; i < userProgram.length; i++){
                    _Memory.mainMem[this.base1 + i] = userProgram[i];
                }
            }else if (_Memory.mainMem[this.base2] == "00"){
                for (var i = 0; i < userProgram.length; i++){
                    _Memory.mainMem[this.base2 + i] = userProgram[i];
                }
            }else if (_Memory.mainMem[this.base3] == "00"){
                for (var i = 0; i < userProgram.length; i++){
                    _Memory.mainMem[this.base3 + i] = userProgram[i];
                }
            }else{
                _StdOut.putText("Out of memory space.");
            }

            console.log("User program in memory: " + _Memory.mainMem);
        }

    }
}
