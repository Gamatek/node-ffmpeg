# FFmpeg

### Exemple: Convert MP4 to MP3 16K
```js
const FFmpeg = require("./ffmpeg");

const options = [];

// Add input file
options.push("-i", "video.mp4");

// Change bitrate to 16K
options.push("-b:a", "16K");

// Set output
options.push("audio.mp3");

const ffmpeg = new FFmpeg(ffmepgPath, options);

ffmpeg.on("progress", ({ timemark }) => {
    // Get current time
    const [ h, min, s ] = timemark.split(":").map((n) => Number(n));
    const totalSeconds = (h*60*60)+(min*60)+s;

    console.log(Math.floor(totalSeconds/ffmpeg.inputs[0].duration*100)+"%");
});
    
ffmpeg.on("end", () => {
    console.log("Conversion completed!");
});
```
