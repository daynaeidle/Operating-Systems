///<reference path="../globals.ts" />

module TSOS {

    export class MemoryManager {

        public loadMem(userProgram){
            for (var i = 0; i < userProgram.length; i++){
                _Memory.mainMem[i] = userProgram[i];
            }

            console.log(_Memory.mainMem);
        }

    }
}
