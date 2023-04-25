const { spawn } = require("child_process");
const { EventEmitter } = require("events");
const nodePath = require("path");

class FFmpeg extends EventEmitter {
    constructor (ffmepgPath, options) {
        super();

        this.ffmpegProc = spawn(ffmepgPath, options);
        this.ffmpegProc.stderr.setEncoding("utf8");
    
        this.ffmpegProc.stderr.on("data", (data) => {
            const progress = this.parseProgressLine(data);
            if(progress) {
                this.emit("progress", progress);
            };
        });
    
        this.ffmpegProc.stderr.on("close", () => {
            this.emit("end");
        });
    };

    inputs = [];

    /**
     * @private
     */
    _currentInput = [];

    parseProgressLine = (line) => {  
        line = line.replace(/=\s+/g, "=").trim();
      
        const input = /Input #(?<id>[\d+]), (?<format>[\w\d,]+), from '(?<location>[^]+)':/g.exec(line)?.groups;
        if(input) {
            this._currentInput.push({
                id: input.id,
                format: input.format,
                location: input.location
            });
        };

        const inputDetails = /Duration: (?<duration>[\d\:\.]*), start: (?<start>[\d\.]*), bitrate: (?<bitrate>[\d]*)/g.exec(line)?.groups;
        if(inputDetails) {
            const { id, format, location } = this._currentInput[this._currentInput.length-1];
            const { duration, start, bitrate } = inputDetails;
            const [ h, min, s ] = duration.split(":").map((n) => Number(n));
            this._currentInput = [];
            this.inputs.push({
                id,
                format: format.split(","),
                location: nodePath.normalize(location),
                duration: (h*60*60)+(min*60)+s,
                start: Number(start),
                bitrate: Number(bitrate)
            });
        };
    
        const progressParts = line.split(" ");
        let progress = {};

        for(let i = 0; i < progressParts.length; i++) {
            const progressSplit = progressParts[i].split("=", 2);
            const key = progressSplit[0];
            const value = progressSplit[1];
            progress[key] = value;
        };

        if(progress?.time) {
            return {
                frames: parseInt(progress.frame, 10),
                currentFps: parseInt(progress.fps, 10),
                currentKbps: progress.bitrate ? parseFloat(progress.bitrate.replace("kbits/s", "")) : 0,
                targetSize: parseInt(progress.size || progress.Lsize, 10),
                timemark: progress.time
            };
        } else {
            return null;
        };
    };
};

module.exports = FFmpeg;
