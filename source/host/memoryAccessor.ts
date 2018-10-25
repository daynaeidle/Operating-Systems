///<reference path="../globals.ts" />
module TSOS {

    export class MemoryAccessor {

        //read value from memory
        public readValue(address: number){

            var base = _currPcb.base;
            var limit = 255;

            //create memory address from base of process
            var memAddress = base + address;

            console.log("current pcb and address: " + _currPcb.PID, + " : " + memAddress);

            //check to see if memory address created is within the process bounds in memory
            if (memAddress <= (base + limit)){
                //return value at address in memory
                return _Memory.mainMem[memAddress];
            }else{
                console.log("Memory address out of bounds.");
            }



        }

        //write value to memory
        public writeValue(address: number, value: number){

            var base = _currPcb.base;
            var limit = 255;
            //create memory address from base of process
            var memAddress = base + address;


            //check to see if memory address created is within the process bounds in memory
            if (memAddress <= (base + limit)){
                //set value at memory location
                _Memory.mainMem[memAddress] = value.toString(16);
            }else{
                console.log("Memory address out of bounds.");
            }

        }

    }

}
