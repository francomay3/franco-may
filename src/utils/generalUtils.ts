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
  const JsDate = new Date(date);
  const year = JsDate.getFullYear();
  const month = JsDate.getMonth();
  const day = JsDate.getDate();
  // return `${days[day - 1]} of ${months[month]}, ${year}`;
  return `${months[month]} ${day}, ${year}`;
};

export const anyOf = (obj: any) => {
  const keys = Object.keys(obj);
  const randomKey = keys[(keys.length * Math.random()) << 0];
  return obj[randomKey];
};

export const getTextFromHtml = (htmlString: string) =>
  new DOMParser().parseFromString(htmlString, "text/html").body.textContent;

// eslint-disable-next-line
export function pipe(...fns: Function[]) {
  return (x: any) => fns.reduce((v, f) => f(v), x);
}
