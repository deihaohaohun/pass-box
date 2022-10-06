import axios from "axios";

const request = axios.create({
  baseURL: "https://admirable-banoffee-39be22.netlify.app/.netlify/functions",
  timeout: 5000,
});

export { request };
