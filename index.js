require("dotenv").config({ path: require("find-up").sync(".env") });
const sessionSecret = process.env.SESSION_SECRET;
const twilioNum = process.env.TWILIO_NUM;
const accSid = process.env.ACCOUNT_SID;
const athTkn = process.env.AUTH_TOKEN;

global.fetch = require("node-fetch");
const Math = require("mathjs");
const client = require("twilio")(accSid, athTkn);
const session = require("express-session");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: sessionSecret }));

const MessagingResponse = require("twilio").twiml.MessagingResponse;
const port = process.env.PORT || 8080;

const laughingGifs = [
  "https://media1.giphy.com/media/XBCJIv6xAyDfrajXoe/giphy.gif",
  "https://i.gifer.com/OwmP.gif",
  "https://1.bp.blogspot.com/-psSaCpk6VKY/UGM3edtIV8I/AAAAAAAADPE/BkC8uaKjoAg/s1600/michael-jordan-laughing.gif",
  "https://www.nwprogressive.org/weblog/wp-content/uploads/2019/11/NOV19-Gervais-Laughing.gif",
  "https://i.gifer.com/3hOr.gif",
  "https://thumbs.gfycat.com/TalkativeAntiqueGibbon-max-1mb.gif",
  "https://i.makeagif.com/media/9-08-2019/Q6WHZx.gif",
  "https://media.tenor.com/images/cab81ff446b2015b86099923dc3c9071/tenor.gif",
  "https://i.gifer.com/4t.gif",
  "https://i.gifer.com/pHd.gif",
  "https://media.tenor.com/images/a2112909851a8ca01b8bfd4e73215588/tenor.gif",
];
const randInt = (maxInt) => Math.floor(Math.random() * maxInt);
const session0 = ["Make me laugh", "Tell me a joke", "New joke", "Joke"];
const session1 = ["TEXT", "CALL"];
const session2 = [...session0,"That didn't work","wasn't funny",];

const smsGif = () => laughingGifs[randInt(laughingGifs.length)];
const invalidResponse0 = () =>`Sorry but that's not a valid response.Please try again.\n\nReply with any of the following to continue:\n\n` + session0.toString().split(",").map(x => x.trim()).join("\n");
const invalidResponse1 = () => `Sorry but that's not a valid response.Please try again.\n\nPlease reply with "TEXT" if would you like me to text you the joke or with "CALL" if you'll prefer hearing it over the phone.`;
const invalidResponse2 = () =>`Sorry but that's not a valid response.Please try again.\n\nReply with any of the following to continue:\n\n` + session2.toString().split(",").map(x => x.trim()).join("\n");

const capitalizeFirstLetter = (words) =>words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();

const validResponse = (arr, str) => {
  let x = false;
  str = str.trim();
  if (
    arr.includes(str) ||
    arr.includes(str.toUpperCase()) ||
    arr.includes(str.toLowerCase()) ||
    arr.includes(capitalizeFirstLetter(str))
  ) {
    x = true;
  }
  return x;
};

const voiceCall = (userNum, message) => {
  return client.calls
    .create({
      twiml: `
        <Response>
          <Say voice="alice" language="en" >${message}</Say>
        </Response>`,
      to: userNum,
      from: twilioNum,
    })
    .then((call) => console.log("call Sid - ", call.sid))
    .catch((err) =>
      console.log("An ERROR OCCURRED While trying to call the user\n\n\n", err)
    );
};
const randomJoke = () => {
  return fetch("https://icanhazdadjoke.com/", {
    method: "GET",
    headers: { Accept: "text/plain" },
  })
    .then((response) => response.text())
    .then((res) => res)
    .catch((err) => console.error("Error getting dad joke", err));
};
//--------------Server---------//

app.post("/sms", async (req, res) => {
  const joke = await randomJoke().then(x=>x)
  const level = req.session.counter || 0;
  const twiml = new MessagingResponse();
  const msg = twiml.message();
  const userNum = req.body.From;
  const userMsg = req.body.Body;
  let onlySms = false;
  let reply = `Hello, hope you're having a great day.\nPlease reply with "TEXT" if would you like me to text you the joke or with "CALL" if you'll prefer hearing it over the phone.`;

  console.log(
    `\nIncoming message from ${userNum}, in ${req.body.FromCity}.\nSms status : ${req.body.SmsStatus}.\nUser's message : ${userMsg}`
  );

  if (level === 2 && !validResponse(session2, userMsg)) {
    reply = invalidResponse2();
  } else if (level === 2 && validResponse(session2, userMsg)) {
    req.session.counter = 1;
    reply = "No problemo, 1 mildly funny joke coming right up.";
  } else if (level === 1 && !validResponse(session2, userMsg)) {
    reply = invalidResponse0();
  } else if (level === 1 && validResponse(session2, userMsg)) {
    req.session.counter = 2;
    if (
      userMsg === "call" ||
      userMsg.toUpperCase() === "CALL" ||
      capitalizeFirstLetter(userMsg) === "Call" ||
      userMsg.toLowerCase() === "call"
    ) {
      voiceCall(userNum, joke);
      reply = "Done";
    } else {
      onlySms = true;
      reply = joke;
    }
  } else if (level === 0 && !validResponse(session2, userMsg)) {
    reply = invalidResponse0();
  } else if (level === 0 && validResponse(session2, userMsg)) {
    req.session.counter = 1;
  }

  msg.body(reply);
  onlySms && msg.media(smsGif());

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

app.get("/", (req, res) => {
  res.send(`twilio number = ${twilioNum}`);
});

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

//twilio can't reach the localhost, so we use ngrok
console.log(
  `enter ngrok http ${port} , copy forwarding link and add /sms,
   update the phone number's message comes in webhook`
);

/* use both custom server and ngrok

twilio phone-numbers:update +19166666657 --sms-url http://localhost:8080/sms
set backup handler url to ngrok 

*/
