import axios from "axios";

const API = axios.create({
  baseURL: "http://10.11.13.251:5000/api",
});

export default API;