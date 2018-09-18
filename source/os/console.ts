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

        public clearLine(): void {
            console.log("Line Height: " + _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin);
            var prompt = _OsShell.promptStr;
            console.log(prompt);
            var promptLen = _DrawingContext.measureText(this.currentFont, this.currentFontSize, prompt);
            console.log("Prompt len: " + promptLen);
            _DrawingContext.clearRect(promptLen,
                                      this.currentYPosition - (_DefaultFontSize +
                                        _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                        _FontHeightMargin) + 5,
                                      _Canvas.width,
                                     (_DefaultFontSize +
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin));
            this.currentXPosition = promptLen;
        }

        private backSpace(): void {
            var len = this.buffer.length;
            var newValue = (this.buffer).substring(0, len - 1);
            console.log(this.currentYPosition);
            console.log(newValue);
            this.clearLine();
            this.buffer = newValue;
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
                    _Commands[_Commands.length] = (this.buffer);
                    cmdListLoc += 1;
                    console.log(cmdListLoc);
                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                }else if (chr == "up") {
                    if (cmdListLoc == 0) {
                        this.buffer = _Commands[cmdListLoc];
                        cmdListLoc = 0;
                    } else {
                        this.buffer = _Commands[cmdListLoc - 1];
                        cmdListLoc -= 1;
                    }
                    this.clearLine();
                    this.putText(this.buffer);
                }else if (chr == "down"){
                    cmdListLoc += 1;
                    console.log(cmdListLoc);


                    if (cmdListLoc > (_Commands.length - 1)){
                        cmdListLoc = _Commands.length -1;
                    }

                    this.buffer = _Commands[cmdListLoc];
                    this.clearLine();
                    this.putText(this.buffer);
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
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
         }

        public advanceLine(): void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize + 
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin;

            //var data = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);
            var lowVal = this.buffer;

            if (this.currentYPosition > _Canvas.height){
                console.log("Below frame");
                console.log(lowVal);
                console.log("Canvas height: " + _Canvas.height);
                console.log("Y Pos: " + this.currentYPosition);
                var scrollVal = this.currentYPosition - _Canvas.height;
                console.log("scroll val: " + scrollVal);
                var data = _DrawingContext.getImageData(0, scrollVal, _Canvas.width, _Canvas.height);
                _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
                _DrawingContext.putImageData(data, 0, 0 );
            }

            // TODO: Handle scrolling. (iProject 1)
        }

        private tab(): void{
            console.log("at function");
            var cmdList = ["ver", "help", "shutdown", "cls", "man", "trace", "rot13", "prompt", "date", "loc", "fact", "status"];
            var cmd = this.buffer;
            var cmdLen;
            console.log("Length: " + cmd.length);
            var matchList = [];
            console.log(matchList.length);
            for (let item of cmdList) {
                if (item.search(cmd) == -1) {
                    console.log("No match");
                } else {
                    matchList[matchList.length] = item;

                }
            }

            console.log(matchList);

                if (matchList.length == 1){
                    this.buffer = matchList[0];
                    this.clearLine();
                    this.putText(this.buffer);
                }else{
                    console.log("too many or no matches");
                }
        }

        /*private cmdRecallUp(): void{
            console.log(cmdListLoc);
            console.log(_Commands);

            if (cmdListLoc == 0){
                this.buffer = _Commands[cmdListLoc];
                cmdListLoc = 0;
            }else{
                this.buffer = _Commands[cmdListLoc - 1];
                cmdListLoc -= 1;
            }

            this.clearLine();
            this.putText(this.buffer);
        }*/

        /*private cmdRecallDown(): void{
            cmdListLoc += 1;
            console.log(cmdListLoc);


            if (cmdListLoc > (_Commands.length - 1)){
                cmdListLoc = _Commands.length -1;
            }

            this.buffer = _Commands[cmdListLoc];
            this.clearLine();
            this.putText(this.buffer);

        }*/




    }
 }
