import { config } from "dotenv";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import { parse } from "node-html-parser";
import http from "http";

config();

const TelegramToken = process.env.TELEGRAM_API_KEY;

const Bot = new TelegramBot(TelegramToken, { polling: true });

const aboutString =
  "Welcome to Halal Checker!" +
  "\nThis Halal checker is powered by JAKIM" +
  "\nAuthored by fiekzz" +
  "\nGithub: https://github.com/fiekzz" +
  "\nTo use this command:" +
  "\n/hello - Say hello to the bot" +
  "\n/about - Info regarding this bot" +
  "\n/checkhalal - Check halal status" +
  "\n\nPlease take note that your result may take a while as JAKIM server is noob";

const messageType = ["/start", "/hello", "/about", "/checkhalal"];

const Parser = (res) => {
  try {
    const root = parse(res.data);

    const getCompany = root
      .querySelector(".search-result-data>.search-company>img")
      ?.getAttribute("title");
    const getDates = root.querySelector(
      ".search-result-data>.search-date-expired"
    );

    const DateObj = getDates.childNodes[0].toString();
    const CompanyObj = getCompany.toString();

    return {
      Company: CompanyObj,
      Expired: DateObj,
    };
  } catch (err) {
    return -1;
  }
};

// process
//   .on('SIGTERM', shutdown('SIGTERM'))
//   .on('SIGINT', shutdown('SIGINT'))
//   .on('uncaughtException', shutdown('uncaughtException'));

// setInterval(console.log.bind(console, 'tick'), 1000);
// http.createServer((req, res) => res.end('hi')).listen(process.env.PORT || 3000, console.log('Listening'));

// function shutdown(signal) {
//   return (err) => {
//     console.log(`${signal}...`);
//     if (err) console.error(err.stack || err);
//     setTimeout(() => {
//       console.log("...waited 5s, exiting.");
//       process.exit(err ? 1 : 0);
//     }, 5000).unref();
//   };
// }

Bot.on("message", (msg) => {
  const chatID = msg.chat.id;

  switch (msg.text) {
    case messageType[0]:
      Bot.sendChatAction(chatID, "typing");
      Bot.sendMessage(chatID, aboutString);
      break;
    case messageType[1]:
      Bot.sendChatAction(chatID, "typing");
      Bot.sendMessage(chatID, "Hello there!");
      break;
    case messageType[2]:
      Bot.sendChatAction(chatID, "typing");
      Bot.sendMessage(chatID, aboutString);
      break;
    case messageType[3]:
      Bot.sendChatAction(chatID, "typing");
      Bot.sendMessage(chatID, "Enter Product or Premise", {
        reply_markup: {
          force_reply: true,
        },
      }).then((sentMessage) => {
        Bot.onReplyToMessage(
          sentMessage.chat.id,
          sentMessage.message_id,
          (reply) => {
            const searchURL = `https://www.halal.gov.my/v4/index.php?data=ZGlyZWN0b3J5L2luZGV4X2RpcmVjdG9yeTs7Ozs=negeri=&category=&cari=${reply.text}`;

            Bot.sendChatAction(chatID, "typing");

            axios
              .get(searchURL)
              .then((res) => {
                const result = Parser(res);

                if (result !== -1) {
                  const Company = result.Company;
                  const Expired = result.Expired;

                  Bot.sendChatAction(chatID, "typing");

                  const createString =
                    `Searching for ${reply.text.toUpperCase()}` +
                    `\n\nResult:` +
                    `\nCompany found:\n` +
                    `${Company}` +
                    `\n\nHalal certificate expires on ${Expired}` +
                    `\n\nReference url:\n` +
                    `<a href="${searchURL}">${reply.text}</a>`;

                  Bot.sendMessage(chatID, createString, {
                    parse_mode: "HTML",
                  });
                } else {
                  const createURL = `https://www.google.com/search?q=Is+${reply.text}+halal?`;

                  const createString =
                    `Cannot find the result for ${reply.text.toUpperCase()} in JAKIM's database` +
                    `\n\nTry <a href="${createURL}">this</a> instead`;

                  Bot.sendChatAction(chatID, "typing");
                  Bot.sendMessage(chatID, createString, {
                    parse_mode: "HTML",
                  });
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }
        );
      });
      break;
  }
});
