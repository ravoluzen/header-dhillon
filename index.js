import fetch from "node-fetch";
import dotenv from "dotenv"
dotenv.config();
import { TwitterClient } from "twitter-api-client";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import http from "http";

let image_data = [];
let count = 0;
let lineOne = "";
let lineTwo = "";
let newItem = 0
let newArray = [];
let indexList = [0]
let title = "";
let twitBanner = "twitter-banner.png"
let newTwitBanner = "new-twitter-banner.png";


const getLyrics = async() => {
    const response = await fetch('https://api-dhillon.deta.dev/lyrics')
    const lyrics = await response.json()

    function getRandomKey(collection) {
        let keys = Array.from(collection.keys());
        newItem =  keys[Math.floor(Math.random() * keys.length)];

        newArray = collection[newItem];
        console.log(newArray)
        return newArray
    }

    getRandomKey(lyrics)

    for(let i = 0; i < newArray.lyrics.length; i++){
        if(newArray.lyrics[i] == "\n"){
            indexList.push(i);
        }
    }

    let initialIndex = indexList[(Math.floor(Math.random()*indexList.length / 2)*2)]
    let middleIndex = indexList[indexList.indexOf(initialIndex)+1]
    let finalIndex = indexList[indexList.indexOf(initialIndex)+2];
    console.log(initialIndex, finalIndex)

    lineOne = '"'+ newArray.lyrics.substring(initialIndex, middleIndex)
    lineTwo = newArray.lyrics.substring(middleIndex, finalIndex) + '"'
    console.log(lineOne, lineTwo)
    title = "Track: " + newArray.title
}

const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_KEY,
  accessTokenSecret: process.env.ACCESS_SECRET,
});
console.log("works")

async function create_text(width, height, text) {
  try {
    const svg_img = `
    <svg width="${width}" height="${height}" style="display:flex; flex-wrap:wrap; align-items:flex-start">
    <style>
    .text {
      font-size: 48px;
      font-weight: 700;
      fill: #fff;
      font-family: Roboto, sans-serif;
      overflow-wrap:break-word;
      border: 2px solid black;
    }
    </style>
    <text x="50%" y="50%" text-anchor="middle" class="text">${text}</text>
    </svg>
    `;
    const svg_img_buffer = Buffer.from(svg_img);
    return svg_img_buffer;
  } catch (error) {
    console.log(error);
  }
}

async function draw_image() {
  try {
    getLyrics()
    const svg_lineOne = await create_text(1500, 500, lineOne);
    const svg_lineTwo = await create_text(1500, 500, lineTwo);
    const svg_title = await create_text(1500, 500, title);

    image_data.push({
        input: svg_title,
        top: -200,
        left: -550,
    },
    {
      input: svg_lineOne,
      top: -40,
      left: 0,
    },
    {
        input: svg_lineTwo,
        top: 40,
        left: 0,
    });

    await sharp(twitBanner)
      .composite(image_data)
      .toFile(newTwitBanner);

    upload_banner(image_data);
  } catch (error) {
    console.log(error);
  }
}

async function upload_banner(files) {
  try {
    const base64 = fs.readFileSync("new-twitter-banner.png", {
      encoding: "base64",
    });
    await twitterClient.accountsAndUsers
      .accountUpdateProfileBanner({
        banner: base64,
      })
      .then(() => {
        console.log("Upload to Twitter done");
        delete_files(files);
        console.log("Ran")
      });
  } catch (error) {
    console.log(error);
  }
}

async function delete_files(files) {
  try {
      image_data = [];
      fs.unlinkSync(newTwitBanner)
      console.log(image_data)
    files.forEach((file) => {
      if (file.input.includes(".png")) {
        fs.unlinkSync(file.input);
        console.log("File removed");
      }
    });
  } catch (err) {
    console.error(err);
  }
}

draw_image();
setInterval(() => {
  draw_image();
}, 30000);

http
  .createServer(function (req, res) {
    res.send("it is running\n");
  })
  .listen(process.env.PORT || 5000);
