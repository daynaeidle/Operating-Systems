///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
///<reference path="console.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

    // array map of key codes to characters
    /*var charCodes: {[key: number]: string};
    charCodes = {192: "\\",
                188: ",",
                190: ".",
                191: "/"};

    let base = {"\\": 192,
                ",": 188,
                ".": 190,
                "/": 191};
    let charCodes = Object.create(base);*/

    //parallel arrays "mapping" character codes to their correct characters
    var charCodes = [192, 191, 188, 190, 186, 222, 219, 221, 220,  187, 189]  //38,    40,     37,     39];
    var charChars = ["`", "/", ",", ".", ";", "'", "[", "]", "\\", "=", "-"] //"up", "down", "left", "right" ];

    //parallel arrays "mapping" character codes to their correct characters when shifted
    var shiftedCodes = [192, 49,  50,  51,  52,  53,  54,  55,  56,  57,  48,  189, 187, 219, 221, 220, 186, 222,  191, 188, 190];
    var shiftedChars = ["~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "{", "}", "|", ":", "\"", "?", "<", ">"];


    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            //super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;
        }



        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
                ((keyCode >= 97) && (keyCode <= 123))) {  // a..z {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);

                //if the keycode can be found in the shiftedCodes array or the charCodes array...
            } else if (shiftedCodes.indexOf(keyCode) != -1 || charCodes.indexOf(keyCode) != -1) {
                //if the keycode is in charCodes array and shift is not pressed...
                if (charCodes.indexOf(keyCode) != -1 && !isShifted){
                    //...write the character at the corresponding index in charChars
                    var index = charCodes.indexOf(keyCode);
                    _KernelInputQueue.enqueue(charChars[index]);
                    //if the keycode can be found in the shiftedCodes array and the shift key is pressed...
                }else if (shiftedCodes.indexOf(keyCode) != -1 && isShifted){
                    //...write the character at the corresponding index in shiftedChars
                    var index = shiftedCodes.indexOf(keyCode);
                    _KernelInputQueue.enqueue(shiftedChars[index]);
                }else{
                    //...print out the actual character(this is only numbers really)
                    chr = String.fromCharCode(keyCode);
                    _KernelInputQueue.enqueue(chr);
                }
            } else if (((keyCode >= 48) && (keyCode <= 57)) ||   // digits
                        (keyCode == 32)                     ||   // space
                        (keyCode == 13)){                        //enter
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            } else if (keyCode == 8) {
                _StdOut.backSpace();
            } else if (keyCode == 9) {
                _StdOut.tab();
            }else if (keyCode == 38){
                _KernelInputQueue.enqueue("up");
            }else if (keyCode == 40){
                _KernelInputQueue.enqueue("down");
            }
        }
    }
}
