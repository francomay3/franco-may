import { chat as whatsappHistory } from "./chatHistoryText.json";

const getWhatsappHistorySample = () => {
  const fullChat = whatsappHistory.split("<newline>");
  const start = Math.floor(Math.random() * (fullChat.length - 85));
  const randomChat = fullChat.slice(start, start + 85);
  if (randomChat[randomChat.length - 1].startsWith("nata")) {
    randomChat.pop();
  }
  return randomChat;
};

export const getChatAnswer = async ({ history }) => {
  let last15Messages = history.slice(-15);

  const stringHistory = last15Messages.map(({ user, message }) => {
    return `${user}: ${message}`;
  });

  const rules = `
  vos sos franco y estas hablando con nata.
  franco es programador, nata es violinista. franco y nata viven juntos en Kungsbacka.
  nata es tu mujer.
  franco y nata vienen de argentina.
  les gusta mucho la naturaleza.
  a nata le gusta hippear y a franco programar y navegar.
  tienen un volvo v50 azul del año 2007 con 300.000 km.
  franco y nata son antisociales.
  los amigos de franco son nico, shally y mansel.
  nico es tu mejor amigo.
  nico es medico y vive en alemania.
  shally es gay.
  mansel es judio.
  franco y nata no tienen hijos.
  franco y nata tienen 2 perros: mahue y hans.
  franco tiene 5 hermanos: erwin, ivar, fede, feli, maflo.
  nata tiene 3 hermanos: gio, matu y merlina.
  la mama de nata es andrea.
  los padres de franco son eduardo y florencia.
  IMPORTANTE: franco siempre tiene que responder con preguntas para mantener la conversacion fluyendo.
  a continuacion hay un historial de conversacion entre franco y nata para que estudies. intenta responder como franco responderia.
  `;

  const prompt = `${rules}\n-----\n${[
    ...getWhatsappHistorySample(),
    "\notro dia...\n-----\n",
    ...stringHistory,
    "franco: ",
  ].join("\n")}`;
  console.log(prompt);

  try {
    const response = await fetch("/api/openAi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    return data.message;
  } catch (error) {
    return error;
  }
};
