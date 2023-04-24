const { spawn } = require("child_process");
const { EventEmitter } = require("events");

const parseProgressLine = (line) => {
    let progress = {};

    // Remove all spaces after = and trim
    line = line.replace(/=\s+/g, "=").trim();
    const progressParts = line.split(" ");
  
    // Split every progress part by "=" to get key and value
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
            currentKbps: progress.bitrate ? parseFloat(progress.bitrate.replace("kbits/s", '')) : 0,
            targetSize: parseInt(progress.size || progress.Lsize, 10),
            timemark: progress.time
        };
    } else {
        return null;
    };
};

class FFmpeg extends EventEmitter {
    constructor (ffmepgPath, options) {
        super();

        this.ffmpegProc = spawn(ffmepgPath, options);
        this.ffmpegProc.stderr.setEncoding("utf8");
    
        this.ffmpegProc.stderr.on("data", (data) => {
            const progress = parseProgressLine(data);
            if(progress) {
                this.emit("progress", progress);
            };
        });
    
        this.ffmpegProc.stderr.on("close", () => {
            this.emit("end");
        });
    }
}

module.exports = FFmpeg;
