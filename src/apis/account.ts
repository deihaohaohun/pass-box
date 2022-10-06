import { request } from "./request";

export async function getAllAccount() {
  return request.get("/account");
}
