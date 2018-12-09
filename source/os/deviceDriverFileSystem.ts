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
                            if (tsb == "100"){
                                return "Disk space is full."
                            }
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
                        var firstPart = str.substring(0, 60);
                        firstPart = this.convertToAscii(firstPart);
                        var str = str.substring(61);

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

        //clear everything on line including pointer val and available bit
        public clearLine(tsb){

            var lineValue = [];

            for (var i = 0; i < 4; i++){
                lineValue.push("0");
            }

            for (var j = 0; j < this.blockSize; j++){
                lineValue.push("00");
            }

            var currBlock = JSON.parse(sessionStorage.getItem(tsb));

            for (var k = 0; k < lineValue.length; k++){
                currBlock[k] = lineValue[k];
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
                            return tsb;
                        }
                    }
                }
            }
        }

        //read data in a file
        public readFile(filename){

            var hexName = this.convertToAscii(filename)
            var hexArr = []
            var str = "";

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


                if (newPointerTsb == "000"){
                    //grab the data from the pointer and convert hexstring to regular string
                    for (var i = 4; i < pointer.length; i++){
                        if (pointer[i] != "00"){
                            hexArr[i-4] = pointer[i];
                        }
                    }
                    str = this.convertToString(hexArr);
                    return str;
                }else{
                    while (newPointerTsb != "000"){

                        //check what pointer bits are
                        newPointerTsb = pointer[1] + pointer[2] + pointer[3];

                        //add pointer data to hexstr
                        for (var j = 4; j < pointer.length; j++){
                            if (pointer[j] != "00"){
                                hexArr.push(pointer[j]);
                            }
                        }

                        console.log(hexArr);

                        //go to new pointer
                        var newPointer = JSON.parse(sessionStorage.getItem(newPointerTsb));

                        //set to current pointer
                        pointer = newPointer;
                        pointerTsb = newPointerTsb;
                    }

                    str = this.convertToString(hexArr);
                    return str;
                }

            }else{
                return "File name does not exist.";
            }
        }

        //delete a file
        public deleteFile(filename){

            var hexName = this.convertToAscii(filename);
            var currBlock;
            var pointer;
            var pointerTsb;

            if (this.fileNameExists(hexName)){

                //get current block and pointer tsb of that block
                var tsb = this.getTsb(filename);
                currBlock = JSON.parse(sessionStorage.getItem(tsb));
                pointerTsb = currBlock[1] + currBlock[2] + currBlock[3];

                while(pointerTsb != "000"){

                    pointerTsb = currBlock[1] + currBlock[2] + currBlock[3];

                    //clear the currentLine and write to session storage
                    currBlock = this.clearLine(tsb);
                    sessionStorage.setItem(tsb, JSON.stringify(currBlock));

                    //get pointer from pointer tsb
                    pointer = JSON.parse(sessionStorage.getItem(pointerTsb));

                    currBlock = pointer;
                    tsb = pointerTsb;

                }

                return ("Successfully deleted file: " + filename);

            }else{
                return "File name does not exist.";
            }
        }

        //format first four bits of each block
        public formatQuick(){

            var diskSize = this.track * this.block * this.sector;

            //check if cpu is executing and dont allow formatting if it is
            if (_CPU.isExecuting){
                return "Cannot format disk while CPU is executing.";
            }else{
                //loop through disk and set first four bits of each block to zero
                for (var i = 0; i < diskSize; i++){
                    var tsb = sessionStorage.key(i);
                    var currBlock = JSON.parse(sessionStorage.getItem(tsb));

                    for (var a = 0; a < 4; a++){
                        currBlock[a] = "0";
                    }

                    sessionStorage.setItem(tsb, JSON.stringify(currBlock));
                }

                return "Successfully formatted disk (quickly)";

            }

        }

        //format entirety of each block
        public formatFull(){

            var diskSize = this.track * this.sector * this.block;

            //check if cpu is executing and dont allow formatting if it is
            if (_CPU.isExecuting){
                return "Cannot format disk while CPU is executing.";
            }else{
                //loop through disk and initialize entire block for each block
                for (var i = 0; i < diskSize; i++){
                    var tsb = sessionStorage.key(i);
                    var currBlock = JSON.parse(sessionStorage.getItem(tsb));
                    currBlock = this.clearLine(tsb);
                    sessionStorage.setItem(tsb, JSON.stringify(currBlock));
                }

                return "Successfully formatted disk (fully).";
            }

        }

        //check if filename exists
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

        //convert string to ascii to hex
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

        //convert hex to ascii to string
        public convertToString(hexArr){

            //create empy string and variable for char
            var char;
            var str = "";

            //loop through hex array and convert each character to a letter and add to string
            for (var i = 0; i < hexArr.length; i++){
                char = String.fromCharCode(parseInt(hexArr[i], 16));
                str += char;
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

        public listFiles(){
            var track = "0";
            var filenames = [];

            //loop through first dir (0) and skip MBR
            for (var i = 0; i < this.sector; i++){
                for (var j = 1; j < this.block; j++){
                    var tsb = track + i.toString() + j.toString();
                    var currBlock = JSON.parse(sessionStorage.getItem(tsb));

                    if (currBlock[0] == "1"){

                        var hexName = [];
                        var index = 4;
                        var filename = "";

                        console.log(currBlock);
                        while (currBlock[index] != "00"){
                            hexName[index - 4] = currBlock[index];
                            index++;
                        }

                        filename = this.convertToString(hexName);
                        console.log(filename);
                        filenames[filenames.length] = filename;

                    }
                }
            }
            console.log(filenames);
            return filenames;
        }

        public loadProcessToDisk(pid, userProg){

            var foundLoc = false;

            for (var j = 0; j < this.sector; j++){
                for (var k = 1; k < this.block; k++){
                    var tsb = "0" + j.toString() + k.toString();
                    var currBlock = JSON.parse(sessionStorage.getItem(tsb));

                    if (currBlock[0] == "0"){
                        foundLoc = true;

                        //change available bit to 1
                        currBlock[0] = "1";

                        //write process and pid as file name
                        var filename = ("process:" + pid);
                        var hexName = this.convertToAscii(filename);
                        for (var a = 0; a < hexName.length; a++){
                            currBlock[a+4] = hexName[a];
                        }

                        //find pointertsb
                        var pointerTsb = this.getPointer();

                        var pointer = JSON.parse(sessionStorage.getItem(pointerTsb));

                        //set available bit of pointer to 1
                        pointer[0] = "1";
                        sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));

                        //update pointer bits on filename block
                        for (var b = 1; b < 4; b++){
                            currBlock[b] = pointerTsb[b-1];
                        }

                        sessionStorage.setItem(tsb, JSON.stringify(currBlock));

                        //write process to pointer file
                        this.writeProcessToDisk(pointerTsb, userProg);
                        return "SUCCESS";

                    }
                }
            }

            if (foundLoc == false){
                return "Disk is full. Program could not be loaded."
            }




        }

        public getProcessFromDisk(filename){

            var hexName = this.convertToAscii(filename)
            var program = [];

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


                if (newPointerTsb == "000"){
                    //grab the data from the pointer and convert hexstring to regular string
                    for (var i = 4; i < pointer.length; i++){
                        program[i-4] = pointer[i];
                    }

                    //clear pointer block
                    pointer = this.clearLine(pointerTsb);
                    sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));

                    return program;
                }else{
                    while (newPointerTsb != "000"){

                        //check what pointer bits are
                        newPointerTsb = pointer[1] + pointer[2] + pointer[3];

                        //add pointer data to hexstr
                        for (var j = 4; j < pointer.length; j++){
                            program.push(pointer[j]);

                        }

                        //go to new pointer
                        var newPointer = JSON.parse(sessionStorage.getItem(newPointerTsb));

                        //clear the pointer line
                        sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));

                        //set to current pointer
                        pointer = newPointer;
                        pointerTsb = newPointerTsb;
                    }

                    sessionStorage.setItem(pointerTsb, JSON.stringify(pointer));
                    return program;
                }

            }else{
                return "File name does not exist.";
            }

        }


        public writeProcessToDisk(tsb, proc){

            if (proc.length > 60){

                var tempProc = proc;

                var offset = 0;

                while (tempProc > 60){

                    var firstPart = [];

                    for (var i = 0; i < 60; i++){
                        firstPart[i] = proc[i + offset];
                        tempProc.pop();
                    }

                    //get a new pointer file to assign to the current pointer file for rest of string
                    var newPointerTsb = this.getPointer();
                    var newPointer = JSON.parse(sessionStorage.getItem(newPointerTsb));
                    //change available bit of new pointer to 1
                    newPointer[0] = "1";
                    sessionStorage.setItem(newPointerTsb, JSON.stringify(newPointer));

                    //update original pointer bits with new pointer tsb
                    for (var i = 1; i < 4; i++){
                        currBlock[i] = newPointerTsb[i-1];
                    }

                    //update pointer file with firstpart
                    for (var j = 0; j < firstPart.length; j++){
                        currBlock[j+4] = firstPart[j];
                    }

                    //write the first 60 characters to the pointer file in sessionstorage
                    sessionStorage.setItem(tsb, JSON.stringify(currBlock));

                    tsb = newPointer;
                    currBlock = newPointerTsb;

                    if (proc.length < 60){
                        for (var k = 0; k < proc.length; k++){
                            currBlock[k+4] = proc[k + offset];
                        }
                        sessionStorage.setItem(tsb, JSON.stringify(currBlock));
                    }

                    offset+=60;

                }

            }else{
                var currBlock = JSON.parse(sessionStorage.getItem(tsb));
                for (var a = 0; a < proc.length; a++){
                    currBlock[a+4] = proc[a];
                }

                sessionStorage.setItem(tsb, JSON.stringify(currBlock));
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