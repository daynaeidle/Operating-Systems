///<reference path="../globals.ts" />
///<reference path="../utils.ts" />
///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />


/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            // date
            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  " - Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;

            // loc
            sc = new ShellCommand(this.shellLoc,
                                  "loc",
                                  " - Displays user's current location.");
            this.commandList[this.commandList.length] = sc;

            // fact
            sc = new ShellCommand(this.shellFact,
                                  "fact",
                                  " - Displays a fun fact.");
            this.commandList[this.commandList.length] = sc;

            //status
            sc = new ShellCommand(this.shellStatus,
                                  "status",
                                  "<string> - Changes your status in the status bar.");
            this.commandList[this.commandList.length] = sc;

            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            //
            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match.  TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an option parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }

        public parseInput(buffer): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        //
        // Shell Command Functions.  Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        public shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        }

        public shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        }

        public shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }

        public shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    // TODO: Make descriptive MANual page entries for the the rest of the shell commands here.
                    case "man":
                        _StdOut.putText("Man displays a manual of each command.");
                        break;
                    case "ver":
                        _StdOut.putText("Ver displays the current name and version of the operating system.");
                        break;
                    case "shutdown":
                        _StdOut.putText("Shutdown does what you think - it shuts down the operating system.");
                        break;
                    case "cls":
                        _StdOut.putText("Cls clears the command line of all previous entries and responses.");
                        break;
                    case "trace":
                        _StdOut.putText("Trace either turns the OS trace on or off, depending on your input.");
                        break;
                    case "rot13":
                        _StdOut.putText("Rot13 encodes the given string by shifting all of the letters by 13. How fun!");
                        _StdOut.advanceLine();
                        _StdOut.putText("For example, 'alpaca' will translate to 'nycnpn'.")
                        break;
                    case "prompt":
                        _StdOut.putText("Prompt sets the line prompt to the given string.")
                        break;
                    case "date":
                        _StdOut.putText("Date prints out the current date and time.");
                        break;
                    case "loc":
                        _StdOut.putText("Loc displays the user's current location...or at least my best guess at the user's location.");
                        break;
                        // TODO: give credit to fact site.
                    case "fact":
                        _StdOut.putText("Fact displays a random fun fact. Enjoy your new knowledge.");
                        break;
                    case "start":
                        _StdOut.putText("The start button starts the operating system.");
                        break;
                    case "halt":
                        _StdOut.putText("The halt stops the program from running without resetting everything.");
                        break;
                    case "reset":
                        _StdOut.putText("The reset button restarts the operating system and resets the page.");
                        break;
                    case "donuts":
                        _StdOut.putText("dOnutS is a virtual operating system created by Dayna Eidle.");
                        break;
                    case "status":
                        _StdOut.putText("Update your status on the status bar. Let us know how you're feeling!");
                        break;
                    case "top":
                        _StdOut.putText("TOPICS:")
                        for (var i=0; i<_OsShell.commandList.length; i++){
                            _StdOut.advanceLine();
                            _StdOut.putText(_OsShell.commandList[i].command)
                        }
                        _StdOut.advanceLine();
                        _StdOut.putText("start");
                        _StdOut.advanceLine();
                        _StdOut.putText("halt");
                        _StdOut.advanceLine();
                        _StdOut.putText("reset");
                        _StdOut.advanceLine();
                        _StdOut.putText("donuts");
                        _StdOut.advanceLine();
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                // TODO: Hopefully change this to a ? instead of top
                _StdOut.putText("Usage: man <topic>  Please supply a topic or 'top' for a list of topics.");
            }
        }

        public shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

        public shellDate(args) {
            var date = new Date().toLocaleDateString();
            var time = new Date().toLocaleTimeString();
            _StdOut.putText("Current Date and Time:");
            _StdOut.advanceLine();
            _StdOut.putText(date + " ~ " + time);
        }

        public shellLoc(args){
            _StdOut.putText("Seeing as though you are reading this, I would assume you are sitting in front of your computer having the best time exploring the dOnutS operating system.")
        }

        public shellFact(args){
            var facts = ['kool', 'mos', 'alaska', 'i', 'pills', 'prius', 'grouch', 'dunks', 'swiss', 'goats', 'selfie']
            var randNum = Math.floor(Math.random() * facts.length);

            switch (facts[randNum]) {
                case 'kool':
                    _StdOut.putText("Kool-Aid was originally marketed as 'Fruit Smack'.");
                    break;
                case 'mos':
                    _StdOut.putText("Only female mosquitoes will bite you.");
                    break;
                case "alaska":
                    _StdOut.putText("Alaska is the only state that you can type using one row of keys (on a traditional keyboard).");
                    break;
                case "i":
                    _StdOut.putText("The dot on the top of a lowercase i is called a tittle.");
                    break;
                case "pills":
                    _StdOut.putText("The Pillsbury Doughboy's real name is Poppin' Fresh.");
                    break;
                case "prius":
                    _StdOut.putText("The plural of Prius (like the car) is Prii.");
                    break;
                case "grouch":
                    _StdOut.putText("Oscar the Grouch was originally orange, not green.");
                    break;
                case "dunks":
                    _StdOut.putText("Dunkin Donuts sells an average of 30 cups of coffee per second.");
                    break;
                case "swiss":
                    _StdOut.putText("In Switzerland, it is illegal to own just one guinea pig.");
                    break;
                case "goats":
                    _StdOut.putText("Billy goats urinate on their own heads in order to smell more attractive to female billy goats.");
                    break;
                case "selfie":
                    _StdOut.putText("In 2017, more people died from injuries caused by taking a selfie than shark attacks.");
                    break;
            }



        }

        // updates the status in the status bar
        public shellStatus(args){
            if (args.length > 0){
                _Status = args;
            } else{
                _StdOut.putText("Usage: status <string>  Please supply a string.")
            }
        }

    }
}
