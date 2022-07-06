export const encodeString = (str: string) => {
  return btoa(str);
};

export const decodeString = (str: string) => {
  return atob(str);
};
