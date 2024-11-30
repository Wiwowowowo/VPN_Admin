const TelegramApi = require("node-telegram-bot-api");

const token = "";

const axios = require("axios");

const moment = require("moment");

moment.locale("ru");

const bot = new TelegramApi(token, {
  polling: true,
});
const AdminOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "Поиск человека",
          callback_data: "Search",
        },
        {
          text: "Обновить данные",
          callback_data: "Update",
        },
      ],
    ],
  }),
};

const UpdateOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "Изменить баланс",
          callback_data: "Balance",
        },
        {
          text: "Изменить Lust_daily",
          callback_data: "Daily",
        },
      ],
    ],
  }),
};

bot.setMyCommands([
  {
    command: "/start",
    description: "Главное меню",
  },
]);
bot.on("message", (msg) => {
  (async () => {
    //console.log(msg)
    const text = msg.text;
    const chatId = msg.chat.id;
    if (text == "/start") {
      await bot.sendMessage(chatId, "Добро пожаловать", AdminOptions);
    } else {
      const last_action = GET_STORE_PARAM(chatId, "action");
      console.log(last_action);
      if (last_action) {
        if (last_action.action_type == "change_balance") {
          await axios.put(
            `http://localhost:3000/users/${last_action.user_id}`,
            {
              balance: `${msg.text}`,
            }
          );

          DELETE_STORE_PARAM(chatId, "action");
        } else if (last_action.action_type == "change_last_sucess") {
          if (msg.text == "false") {
            await axios.put(
              `http://localhost:3000/users/${last_action.user_id}`,
              {
                last_succes_daily: false,
              }
            );
          } else if (msg.text == "true") {
            await axios.put(
              `http://localhost:3000/users/${last_action.user_id}`,
              {
                last_succes_daily: true,
              }
            );
          }
          DELETE_STORE_PARAM(chatId, "action");
        }
      } else {
        const data = await axios.get(`http://localhost:3000/users/${text}`);
        for (const dat of data.data) {
          let pay = "";
          for (const text of dat.payment) {
            const date_how = moment(text.date).format("D MMM YYYY");
            pay += `Дата платежки: ${date_how}\nСумма платежки: ${text.amount}\n`;
          }
          const date_how = moment().format("D MMM YYYY");
          await bot.sendMessage(
            chatId,
            `Id: ${dat.user.id} \nИмя: ${dat.user.name} \ntelegram_id: ${
              dat.user.telegram_id
            } \nemail: ${dat.user.email} \nlast_succes_daily: ${
              dat.user.last_succes_daily
            } \nbalance: ${dat.user.balance} \ntg_username: ${
              dat.user.tg_username
            } \nКол-во девайсов: ${
              dat.devices.length
            } \nИспользовано трафика: ${Math.round(
              dat.bytes / 1024 / 1024 / 1024
            )} gb\n ${pay}`,
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [
                    {
                      text: "Изменить баланс",
                      callback_data: `Balance${dat.user.id}`,
                    },
                    {
                      text: "Изменить Last_daily",
                      callback_data: `Daily${dat.user.id}`,
                    },
                  ],
                ],
              }),
            }
          );
        }
      }
    }
  })().catch((e) => {
    console.log(e);

    bot.sendMessage(msg.chat.id, "Произошла какая-то ошибка, повторите запрос");
  });
});
const STORE = {};
const ADD_STORE_PARAM = (chatId, key, value) => {
  if (!STORE[chatId]) STORE[chatId] = {};
  STORE[chatId][key] = value;
};

const GET_STORE_PARAM = (chatId, key) => {
  if (!STORE[chatId]) return undefined;
  return STORE[chatId][key];
};

const DELETE_STORE_PARAM = (chatId, key) => {
  if (STORE[chatId]) {
    delete STORE[chatId][key];
  }
};

bot.on("callback_query", (cb) => {
  (async () => {
    await bot.answerCallbackQuery(cb.id);
    const chatId = cb.from.id;
    if (cb.data.startsWith("Balance")) {
      const user_id = cb.data.replace(/\D/g, "");
      ADD_STORE_PARAM(chatId, "action", {
        action_type: "change_balance",
        user_id: user_id,
      });
      await bot.sendMessage(chatId, "Введите новый баланс");
    } else if (cb.data.startsWith("Daily")) {
      const user_id = cb.data.replace(/\D/g, "");
      ADD_STORE_PARAM(chatId, "action", {
        action_type: "change_last_sucess",
        user_id: user_id,
      });
      await bot.sendMessage(chatId, "Введите новый дейли true or false");
    }
  })().catch((e) => {
    console.log(e);
    bot.sendMessage(cb.from.id, "Произошла неизвестная ошибка");
  });
});
