///<reference path="../globals.ts" />

module TSOS {

    export class MemoryManager {

        //set bases for 3 sections
        public base1: number = 0;
        public base2: number = 256;
        public base3: number = 512;
        public limitReg: number = 255;

        public loadMem(userProgram){

            //put the program in the first available area of memory and return the base value
            //section 1 of memory
            if (_Memory.mainMem[this.base1] == "00"){
                for (var i = 0; i < userProgram.length; i++){
                    _Memory.mainMem[this.base1 + i] = userProgram[i];

                }
                return this.base1;

             //section 2 of memory
            }else if (_Memory.mainMem[this.base2] == "00"){
                for (var i = 0; i < userProgram.length; i++){
                    _Memory.mainMem[this.base2 + i] = userProgram[i];
                }
                return this.base2;

            //section 3 of memory
            }else if (_Memory.mainMem[this.base3] == "00"){
                for (var i = 0; i < userProgram.length; i++){
                    _Memory.mainMem[this.base3 + i] = userProgram[i];
                }
                return this.base3;

            }else{
                //return -1 if no memory is available
                console.log("Out of memory space.");
                return -1;
            }

            //console.log("User program in memory: " + _Memory.mainMem[0]);
        }

    }
}
