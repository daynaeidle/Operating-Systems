///<reference path="../globals.ts" />
module TSOS {

    export class MemoryAccessor {

        public readValue(address: number){

            var base = _currPcb.base;
            var limit = 255;
            //create memory address from base of process
            var memAddress = base + address;

            //check to see if memory address created is within the process bounds in memory
            if (memAddress < (base + limit)){
                //return value at address in memory
                return _Memory.mainMem[memAddress];
            }else{
                console.log("Memory address out of bounds.");
            }



        }

        public writeValue(address: number, value: number){

            var base = _currPcb.base;
            var limit = 255;
            //create memory address from base of process
            var memAddress = base + address;

            //check to see if memory address created is within the process bounds in memory
            if (memAddress <= (base + limit)){
                //set value at memory location
                _Memory.mainMem[memAddress] = String(value);
            }else{
                console.log("Memory address out of bounds.");
            }

        }

    }

}
