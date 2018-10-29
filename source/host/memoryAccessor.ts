///<reference path="../globals.ts" />
module TSOS {

    export class MemoryAccessor {

        //read value from memory
        public readValue(address: number){

            //console.log(address);

            var base = _currPcb.base;
            //console.log("base in mem access: " + base);

            //create memory address from base of process
            var memAddress = Number(base + address);

            //console.log("current pcb and address: " + _currPcb.PID + " : " + memAddress);

            //check to see if memory address created is within the process bounds in memory
            if (memAddress <= (base + _limit)){
                //return value at address in memory
                return _Memory.mainMem[memAddress];
            }else{
                console.log("Memory address out of bounds.");
            }



        }

        //write value to memory
        public writeValue(address: number, value: number){

            var base = _currPcb.base;
            //create memory address from base of process
            var memAddress = base + address;


            //check to see if memory address created is within the process bounds in memory
            if (memAddress <= (base + _limit)){
                //set value at memory location
                _Memory.mainMem[memAddress] = value.toString(16);
            }else{
                console.log("Memory address out of bounds.");
            }

        }

    }

}
