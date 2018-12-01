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
            this.blockSize = 64;
            this.driverEntry = this.krnFileSysDriverEntry;
        }

        public krnFileSysDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

    }
}