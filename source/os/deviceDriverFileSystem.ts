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
            this.driverEntry = this.krnFileSysDriverEntry;
            this.track = 4;
            this.sector = 8;
            this.block = 8;
            this.blockSize = 60;

        }

        public krnFileSysDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?

            console.log("Im in the driver entry");

            if (sessionStorage){
                console.log("im in the first if");
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

                //create tsb for each track sector block and store in session storage with linevalue
                sessionStorage.clear();
                for (var i = 0; i < this.track; i++){
                    for (var j = 0; j < this.sector; j++){
                        for (var k = 0; k < this.block; k++){
                            console.log("im in the loop");
                            tsb = i.toString() + j.toString() + k.toString();
                            sessionStorage.setItem(tsb, JSON.stringify(lineValue));
                        }
                    }
                }



            }else{

                console.log("Sorry your browser does not support Session Storage.");
            }

        }


        //create a new file
        public createFile(filename){

            var hexName = this.convertToAscii(filename);

            //console.log("tsb is 001" + JSON.parse(sessionStorage.getItem("001")));

            //check for existing filename

            if (this.fileNameExists(hexName)){
                console.log("File name already exists.");
            }else{
                //loop through disk to find first available block after MBR
                for (var i = 0; i < this.track; i++){
                    for (var j = 0; j < this.sector; j++){
                        for (var k = 0; k < this.block; k++){
                            var tsb = i.toString() + j.toString() + k.toString();
                            console.log("TSB: " + tsb);
                            var currBlock = JSON.parse(sessionStorage.getItem(tsb));

                            if (tsb !== "000"){

                                //check if available bit is 0 (not in use)
                                if (currBlock[0] == "0"){
                                    //we can use this block!

                                    //set available bit to 1
                                    currBlock[0] = "1";

                                    //setpointer
                                    var pointerTsb = this.getPointer();
                                    for (var a = 1; a < 4; a++){
                                        currBlock[a] = pointerTsb[a-1];
                                    }

                                    //set pointer tsb available bit to 1
                                    var pointer = JSON.parse(sessionStorage.getItem(pointerTsb));
                                    pointer[0] = "1";
                                    sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));

                                    //set filename starting at index 4
                                    for (var b = 0; b < hexName.length; b++){
                                        currBlock[b+4] = hexName[b];
                                    }
                                    sessionStorage.setItem(tsb, JSON.stringify(currBlock));
                                    console.log("Set file name: " + hexName);
                                    console.log("Original name: " + filename);
                                    return;
                                }


                            }

                        }
                    }

                }

            }


        }

        //write data to a file
        public writeFile(filename, str){

            var hexName = this.convertToAscii(filename);

            //check if filename exists
            if (this.fileNameExists(hexName)){

                var currTsb = this.getTsb(filename);

                //find pointerlocation
                var pointerTsb = currTsb[1] + currTsb[2] + currTsb[3];

                //clear current data
                var pointer = JSON.parse(sessionStorage.getItem(pointerTsb));
                pointer = this.clearData(pointerTsb);

                var hexStr = this.convertToAscii(str);

                if (filename.length > 60){

                    while (str.length > 60){

                        //separate the string into the first 60 bits and the rest
                        var firstPart = str.substring(0, 59);
                        var str = str.substring(60);

                        //write the first 60 characters to the pointer file
                        sessionStorage.setItem(pointerTsb, JSON.stringify(firstPart));

                        //get a new pointer file to assign to the current pointer file for rest of string
                        var newPointerTsb = this.getPointer();
                        var newPointer = JSON.parse(sessionStorage.getItem(newPointerTsb));
                        //change available bit of new pointer to 1
                        newPointer[0] = "1"

                        //set the new pointer to the current pointer's pointer bits
                        for (var i = 0; i < newPointerTsb.length; i++){
                            pointer[i + 1] = newPointerTsb[i];
                        }

                        pointer = newPointer;
                        pointerTsb = newPointerTsb;

                        if (str.length < 60){
                            sessionStorage.setItem(pointerTsb, JSON.stringify(str));
                        }

                    }


                }else{
                    //set the hex value of the string in the pointer block
                    sessionStorage.setItem(pointerTsb, JSON.stringify(hexStr));
                    console.log(hexStr + " - original: " + str + " - wrote to " + pointerTsb);
                }



            }else{
                console.log("Filename does not exist.")
            }

        }

        //clear data on line
        public clearData(tsb){

            var lineValue = [];

            //set base line values to 00
            for (var i = 0; i < this.blockSize; i++){
                lineValue.push("00");
            }

            var currBlock = JSON.parse(sessionStorage.getItem(tsb));

            for (var i = 0; i < lineValue.length; i++){
                currBlock[i+4] = lineValue[i];
            }
            return currBlock;
        }



        //get tsb from a filename
        public getTsb(filename){

            var hexName = this.convertToAscii(filename);

            for (var i = 0; i < this.track; i++){
                for (var j = 0; j < this.sector; j++){
                    for (var k = 0; k < this.block; k++){

                        var tsb = i.toString() + j.toString() + k.toString();

                        var currFilename = JSON.parse(sessionStorage.getItem(tsb));

                        if (currFilename == hexName){
                            return tsb;
                        }

                    }
                }
            }


        }


        public readFile(filename){

            //check if filename exists
            if (this.fileNameExists(filename)){
                //get the tsb and read the info at that pointer
                var tsb = this.getTsb(filename);
                var currBlock = JSON.parse(sessionStorage.getItem(tsb));
                var pointerTsb = currBlock[1] + currBlock[2] + currBlock[3];
                var data = JSON.parse(sessionStorage.getItem(pointerTsb));
                console.log(this.convertToString(data));
            }else{
                console.log("File name does not exist.");
            }

        }


        public deleteFile(filename){

        }


        public fileNameExists(filename){

            //boolean var for filenameexists


            //loop through disk and look for matching filename
            for (var i = 0; i < this.track; i++){
                for (var j = 0; j < this.sector; j++){
                    for (var k = 0; k < this.block; k++){

                        var filenameExists = true;

                        var tsb = i.toString() + j.toString() + k.toString();

                        var dirFileName = JSON.parse(sessionStorage.getItem(tsb));


                        for (var a = 0; a < filename.length; a++){
                            console.log(dirFileName[a + 4] == filename[a]);
                            if (dirFileName[a + 4] != filename[a]){
                                filenameExists = false;
                            }


                        }
                        console.log("after eval:" + filenameExists);
                        if (filenameExists){
                            return filenameExists;
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

            var index = 0;
            var char;
            var newStr = "";

            while(index <= str.length && str[index] != "00"){
                char = String.fromCharCode(parseInt(str[index], 16));
                newStr+=char;
                index++;
            }

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