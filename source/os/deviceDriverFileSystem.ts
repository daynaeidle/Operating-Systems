///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
///<reference path="console.ts" />

module TSOS {
    export class DeviceDriverFileSystem extends DeviceDriver{
        public track: number;
        public sector: number;
        public block:number;
        public blockSize:number;

        constructor(){
            super();
            this.track = 4;
            this.sector = 8;
            this.block = 8;
            this.blockSize = 60;
            this.driverEntry = this.krnFileSysDriverEntry;
        }

        public krnFileSysDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?

            if (sessionStorage){
                if (sessionStorage.length == 0){

                    var tsb: string;

                    var lineValue = [];

                    //set single bits for available bit and pointer
                    for (var i = 0; i < 4; i++){
                        lineValue.push("0")
                    }

                    //set base line values to 00
                    for (var i = 0; i < this.blockSize; i++){
                        lineValue.push("00");
                    }

                    console.log(lineValue);

                    //create tsb for each track sector block and store in session storage with linevalue
                    for (var i = 0; i < this.track; i++){
                        for (var j = 0; j < this.sector; j++){
                            for (var k = 0; k < this.block; j++){
                                tsb = i.toString() + j.toString() + k.toString();
                                sessionStorage.setItem(tsb, JSON.stringify(lineValue));
                            }
                        }
                    }

                }



            }else{

                console.log("Sorry your browser does not support Session Storage.");
            }

            Control.loadDiskTable();


        }



        public createFile(filename){

            var hexName = this.convertToAscii(filename);

            //check for existing filename

            if (this.fileNameExists(hexName)){
                console.log("File name already exists.");
            }else{
                if (filename.length > 60){
                    console.log("Filename is too long");
                }else{
                    //loop through disk to find first available block after MBR
                    for (var i = 0; i < this.track; i++){
                        for (var j = 0; j < this.sector; j++){
                            for (var k = 0; k < this.block; k++){
                                var tsb = i.toString() + j.toString() + k.toString();

                                var currBlock = JSON.parse(sessionStorage.getItem(tsb));

                                if (tsb == "000"){
                                    continue
                                }else{

                                    //check if available bit is 0 (not in use)
                                    if (currBlock[0] == "0"){
                                        //we can use this block!

                                        //set available bit to 1
                                        currBlock[0] = "1"

                                        //setpointer
                                        var pointerTsb = this.getPointer();
                                        for (var a = 1; a < 4; a++){
                                            currBlock[a] = pointerTsb[a-1];
                                        }

                                        //set filename starting at index 4
                                        for (var b = 0; b < hexName.length; b++){
                                            currBlock[b+4] = hexName[b];
                                        }
                                    }

                                }

                            }
                        }
                    }

                }

            }


        }


        public writeFile(filename, str){

        }


        public readFile(filename){

        }


        public deleteFile(filename){

        }


        public fileNameExists(filename){

            //boolean var for filenameexists
            var filenameExists = false;

            //loop through disk and look for matching filename
            for (var i = 0; i < this.track; i++){
                for (var j = 0; j < this.sector; j++){
                    for (var k = 0; k < this.block; k++){

                        var tsb = i.toString() + j.toString() + k.toString();

                        var dirFileName = JSON.parse(sessionStorage.getItem(tsb));

                        if (dirFileName == filename){

                            filenameExists = true;

                        }
                    }
                }
            }

            return filenameExists;

        }

        public convertToAscii(data){

            //create an empty array for the new hex values for each letter
            var hexArr = [];

            //loop through string and convert each letter to ascii hex
            //and push to array
            for (var i = 0; i < data.length; i++){
                hexArr[hexArr.length] = data.charCodeAt(i).toString(16);
            }

            return hexArr;
        }

        public convertToString(str){

        }

        //find an available pointer
        public getPointer(){

            //start pointer section on the second track
            for (var i = 1; i < this.track; i++){
                for (var j = 0; j < this.sector; j++){
                    for (var k = 0; k < this.block; k++){

                        var tsb = i.toString() + j.toString() + k.toString();

                        var block = JSON.parse(sessionStorage.getItem(tsb));

                        if (block[0] == 0){
                            return tsb;
                        }

                    }
                }
            }
        }

    }
}

//for loop for literally everything
/*
for (var i = 0; i < this.track; i++){
    for (var j = 0; j < this.sector; j++){
        for (var k = 0; k < this.block; k++){

        }
    }
}
*/