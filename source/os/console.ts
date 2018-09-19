///<reference path="../globals.ts" />

/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    // command list and length for command recall
    var _Commands = [];
    var cmdListLoc = 0;

    export class Console {

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "") {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
        }

        private clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        private resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }


        private clearLine(): void {
            console.log("Line Height: " + _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin);
            //set the prompt string to a variable
            var prompt = _OsShell.promptStr;
            console.log(prompt);
            //get the length of the prompt string
            var promptLen = _DrawingContext.measureText(this.currentFont, this.currentFontSize, prompt);
            console.log("Prompt len: " + promptLen);
            //clear everything on the current line after the prompt string
            console.log("Font size: " + _DefaultFontSize);
            console.log("Margin: " + _FontHeightMargin);
            _DrawingContext.clearRect(promptLen, //start after the prompt
                                      this.currentYPosition - (_DefaultFontSize +
                                        _DrawingContext.fontDescent(this.currentFont, this.currentFontSize)), //start at the y position above the line (not including margins)
                                      _Canvas.width, //width of the canvas
                                     (_DefaultFontSize +
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin)); //height of the line
            //set the x position to just after the prompt string
            this.currentXPosition = promptLen;
        }

        private backSpace(): void {
            //get the length of the buffer
            var len = this.buffer.length;
            //make a substring of the buffer (one less character) and set it to newValue
            var newValue = (this.buffer).substring(0, len - 1);
            console.log(this.currentYPosition);
            console.log(newValue);
            //clear the line
            this.clearLine();
            //set the buffer to the new value
            this.buffer = newValue;
            //write the new value to the line
            this.putText(this.buffer);
        }



        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { //     Enter key
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...

                    //add the input to the commands array
                    _Commands[_Commands.length] = (this.buffer);
                    //add one to the cmdListLoc variable since a command was added
                    //set the cmdListLoc to the length of the commands array to use as an index variable
                    cmdListLoc = _Commands.length;
                    console.log(cmdListLoc);

                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                } else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            }
        }

        public putText(text): void {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text !== "") {
                
                //make an array of the words on the line, found by spaces as a separator
                var words = text.split(" ");
                console.log("Words: " + words);
                //create a current line variable
                var currLine = '';

                //Linewrap
                //Because this is linewrap by word, if you input a single word that is longer
                //than the length of the canvas, it won't wrap around to a new line because the characters
                //aren't accounted for.
                //Would like to enhance this later to account for both words and characters

                //if its just one word, then don't bother with the second half of the code
                if (words.length <= 1){
                    // Draw the text at the current X and Y coordinates.
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                    // Move the current X position.
                    var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                    this.currentXPosition = this.currentXPosition + offset;
                }else{
                    //for each word in the words array
                    for (let word of words){
                        //make a variable of the current line + the word + a space
                        var test = currLine + word + " ";
                        //find the size of the line
                        var lineSize = _DrawingContext.measureText(this.currentFont, this.currentFontSize, test);
                        console.log(lineSize);
                        console.log(lineSize > _Canvas.width);
                        //if that new line's width is longer than the canvas width
                        if (lineSize > _Canvas.width){
                            //draw the current line (without the addition of the word and the space)
                            _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, currLine);
                            //move the current x position
                            var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, " ");
                            this.currentXPosition = this.currentXPosition + offset;
                            //set current line equal to the word + a space
                            currLine = word + " ";
                            //advance to the next line
                            this.advanceLine();
                        }else{
                            //otherwise, set current line equal to the current line + the word + a space
                            currLine = test;
                        }
                    }
                    //draw the current line
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, currLine);
                    //move the current x position
                    var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, currLine);
                    this.currentXPosition = this.currentXPosition + offset;
                }

            }

         }

        public advanceLine(): void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */

            var y = this.currentYPosition;

            this.currentYPosition += _DefaultFontSize + 
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin;

            var lineHeight = _DefaultFontSize +
                            _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                            _FontHeightMargin;


            //scrolling
            //if the lines go below the canvas height
            if (this.currentYPosition > _Canvas.height){
                /*console.log("Below frame");
                console.log("Canvas height: " + _Canvas.height);
                console.log("Y Pos: " + this.currentYPosition);
                console.log("Line height: " + lineHeight);*/

                //get the image data(text) from the y position at the bottom of the first line to the current y position
                var data = _DrawingContext.getImageData(0, lineHeight, _Canvas.width, this.currentYPosition);
                //clear the screen
                this.clearScreen();
                //put the image data on the canvas starting at the coordinate (0,0)
                _DrawingContext.putImageData(data, 0, 0);
                //reset y so that it's not below the canvas when the line advances
                this.currentYPosition = y;
            }

        }

        //command completion when pressing tab
        private tab(): void{
            var cmdList = _OsShell.commandList;
            var buf = this.buffer;
            var bufLen = buf.length;
            console.log("Length: " + buf.length);
            var matchList = [];
            console.log(matchList.length);
            //for each index in cmdlist
            for (let i in cmdList) {
                //get a command at that index
                var cmd = cmdList[i].command;
                //if the buffer matches a command
                if (cmd.substring(0, bufLen) == buf) {
                    //...add the item to matchList
                    matchList[matchList.length] = cmd;
                    //...otherwise...
                } else {
                    //..do nothing really.
                    console.log("No match");
                }
            }

            console.log(matchList);
                //if just one match is found...
                if (matchList.length == 1){
                    //...clear the line and print it out
                    this.buffer = matchList[0];
                    this.clearLine();
                    this.putText(this.buffer);
                }else{
                    ///otherwise don't do anything because a longer buffer is required
                    console.log("too many or no matches");
                }
        }

        //up key to scroll up through commandlist
        private cmdRecallUp(): void{
            console.log(cmdListLoc);
            console.log(_Commands);

            //if the index is 0
            if (cmdListLoc == 0){
                //set the buffer to the command at index 0
                this.buffer = _Commands[cmdListLoc];
            }else{
                //otherwise, decrement the index by 1 and set the command at that index to the buffer
                cmdListLoc -= 1;
                this.buffer = _Commands[cmdListLoc];
            }

            //clear the line and write the buffer to the line
            this.clearLine();
            this.putText(this.buffer);
        }

        //down key to scroll down through commandlist
        private cmdRecallDown(): void{
            console.log(cmdListLoc);

            //if the index is greater than or equal to the length - 1 (last element) of the commands list...
            if (cmdListLoc >= _Commands.length - 1){
                //do nothing
                console.log("No lower commands");
            }else{
                //otherwise, add 1 to cmdListLoc, set the command at that index to the buffer,
                //clear the line, and write the buffer
                cmdListLoc += 1;
                this.buffer = _Commands[cmdListLoc];
                this.clearLine();
                this.putText(this.buffer);
            }
        }




    }
 }
