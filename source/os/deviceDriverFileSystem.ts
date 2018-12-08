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

            if (sessionStorage){
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
        public createFile(filename): string{

            var hexName = this.convertToAscii(filename);

            //check for existing filename
            if (this.fileNameExists(hexName)){
                return "File name already exists.";
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
                                    return ("Successfully created file: " + filename);
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

                //get tsb from the given filename
                var currTsb = this.getTsb(filename);

                //get current block from that tsb
                var currBlock = JSON.parse(sessionStorage.getItem(currTsb));

                //find pointerlocation of that tsb
                var pointerTsb = currBlock[1] + currBlock[2] + currBlock[3];

                //clear current data at the pointer
                var pointer = JSON.parse(sessionStorage.getItem(pointerTsb));
                pointer = this.clearData(pointerTsb);

                //convert the given string to a hexstring
                var hexStr = this.convertToAscii(str);

                if (str.length > 60){

                    //continue this loop until string is no longer 60 characters
                    while (str.length > 60){

                        //separate the string into the first 60 bits and the rest
                        var firstPart = str.substring(0, 59);
                        firstPart = this.convertToAscii(firstPart);
                        var str = str.substring(60);

                        //get a new pointer file to assign to the current pointer file for rest of string
                        var newPointerTsb = this.getPointer();
                        var newPointer = JSON.parse(sessionStorage.getItem(newPointerTsb));
                        //change available bit of new pointer to 1
                        newPointer[0] = "1";
                        sessionStorage.setItem(newPointerTsb, JSON.stringify(newPointer));

                        //update original pointer bits with new pointer tsb
                        for (var i = 1; i < 4; i++){
                            pointer[i] = newPointerTsb[i-1];
                        }

                        //update pointer file with firstpart
                        for (var j = 0; j < firstPart.length; j++){
                            pointer[j+4] = firstPart[j];
                        }

                        //write the first 60 characters to the pointer file in sessionstorage
                        sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));

                        pointer = newPointer;
                        pointerTsb = newPointerTsb;

                        if (str.length < 60){
                            str = this.convertToAscii(str);
                            for (var k = 0; k < str.length; k++){
                                pointer[k+4] = str[k];
                            }
                            sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));
                        }

                    }


                }else{
                    //set the hex value of the string in the pointer block
                    for (var a = 0; a < hexStr.length; a++){
                        pointer[a+4] = hexStr[a];
                    }
                    sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));
                    console.log(hexStr + " - original: " + str + " - wrote to " + pointerTsb);
                }

                return ("Successfull wrote to file: " + filename);

            }else{
                return ("Filename does not exist");
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
        public getTsb(filename): string{

            var hexName = this.convertToAscii(filename);

            for (var i = 0; i < this.track; i++){
                for (var j = 0; j < this.sector; j++){
                    for (var k = 0; k < this.block; k++){

                        //boolean var for filename exists set tot true
                        var filenameExists = true;

                        //set tsb var
                        var tsb = i.toString() + j.toString() + k.toString();

                        //get the filename in disk
                        var dirFileName = JSON.parse(sessionStorage.getItem(tsb));

                        //loop through filename and dirfilename and check for matches in each letter
                        for (var a = 0; a < hexName.length; a++){
                            //console.log(dirFileName[a + 4] == filename[a]);
                            //if any are different, set filename exists to false
                            if (dirFileName[a + 4] != hexName[a]){
                                filenameExists = false;
                            }

                        }
                        //if filenameexists is true after looping through filename
                        //check next character of dirfilename in case name is longer than filename
                        if (filenameExists){
                            //if its not zero then filenames are different
                            //so set filenameexists to false
                            if (dirFileName[hexName.length + 4] != "00"){
                                filenameExists = false;
                            }
                        }

                        //stop the loop if filenameexists is true
                        if (filenameExists){
                            console.log(tsb);
                            return tsb;
                        }
                    }
                }
            }
        }


        public readFile(filename){

            var hexName = this.convertToAscii(filename)

            //check if filename exists
            if (this.fileNameExists(hexName)){
                //get the tsb of the file and data at that block
                var tsb = this.getTsb(filename);
                var currBlock = JSON.parse(sessionStorage.getItem(tsb));
                //find the pointer of the filename block
                var pointerTsb = currBlock[1] + currBlock[2] + currBlock[3];
                var pointer = JSON.parse(sessionStorage.getItem(pointerTsb));
                //get the pointer's pointer
                var newPointerTsb = pointer[1] + pointer[2] + pointer[3];
                var hexArr = []
                var str = "";

                if (newPointerTsb == "000"){
                    //grab the data from the pointer and convert hexstring to regular string
                    for (var i = 4; i < pointer.length; i++){
                        if (pointer[i] != "00"){
                            hexArr[i-4] = pointer[i];
                        }

                    }
                    console.log(hexArr);
                    str = this.convertToString(hexArr);
                    return str;
                }else{
                    while (newPointerTsb != "000"){
                        //add pointer data to hexstr
                        console.log("filler");

                        //go to new pointer

                        //grab that data

                        //check pointer tsb there

                        //repeat if necessary
                    }
                }


            }else{
                return "File name does not exist.";
            }

        }


        public deleteFile(filename){

        }


        public fileNameExists(filename){
            //loop through disk and look for matching filename
            for (var i = 0; i < this.track; i++){
                for (var j = 0; j < this.sector; j++){
                    for (var k = 0; k < this.block; k++){

                        //boolean var for filename exists set tot true
                        var filenameExists = true;

                        //set tsb var
                        var tsb = i.toString() + j.toString() + k.toString();

                        //get the filename in disk
                        var dirFileName = JSON.parse(sessionStorage.getItem(tsb));

                        //loop through filename and dirfilename and check for matches in each letter
                        for (var a = 0; a < filename.length; a++){
                            //console.log(dirFileName[a + 4] == filename[a]);
                            //if any are different, set filename exists to false
                            if (dirFileName[a + 4] != filename[a]){
                                filenameExists = false;
                            }

                        }
                        //if filenameexists is true after looping through filename
                        //check next character of dirfilename in case name is longer than filename
                        if (filenameExists){
                            //if its not zero then filenames are different
                            //so set filenameexists to false
                            if (dirFileName[filename.length + 4] != "00"){
                                filenameExists = false;
                            }
                        }
                        //stop the loop if filenameexists is true
                        if (filenameExists){
                            return filenameExists;
                        }
                    }
                }
            }
            //return filenameexists after looping through all
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

        public convertToString(hexArr){

            var char;
            var str = "";

            for (var i = 0; i < hexArr.length; i++){
                char = String.fromCharCode(parseInt(hexArr[i], 16));
                str += char;
                console.log(str);
            }

            return str;

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