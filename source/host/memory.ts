///<reference path="../globals.ts" />

module TSOS {

    export class Memory {

        //create a memory array
        public memory = [];

        public init(){
            //making it size 768 in anticipation for project 3
            for (var i = 0; i < 768; i++){
                //load the array with all 00
                this.memory[i] = "00";
            }
        }


    }
}
