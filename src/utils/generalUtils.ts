export const getDateAsString = (date: number) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
  ];
  const days = [
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "twenty-first",
    "twenty-second",
    "twenty-third",
    "twenty-fourth",
    "twenty-fifth",
    "twenty-sixth",
    "twenty-seventh",
    "twenty-eighth",
    "twenty-ninth",
    "thirtieth",
    "thirty-first",
  ];
  const JsDate = new Date(date);
  const year = JsDate.getFullYear();
  const month = JsDate.getMonth();
  const day = JsDate.getDate();
  return `${days[day - 1]} of ${months[month]}, ${year}`;
};

export const anyOf = (obj: any) => {
  const keys = Object.keys(obj);
  const randomKey = keys[(keys.length * Math.random()) << 0];
  return obj[randomKey];
};
