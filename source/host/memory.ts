///<reference path="../globals.ts" />

module TSOS {

    export class Memory {

        //create a memory array
        public mainMem: string[];

        public init(){
            this.mainMem = new Array<string>();
            //making it size 768 in anticipation for project 3
            for (var i = 0; i < 768; i++){
                //load the array with all 00
                this.mainMem[i] = "00";
            }
            console.log(this.mainMem);
        }


    }
}
