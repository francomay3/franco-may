import { z } from "zod";

export const uid = z.string().min(20);
export const name = z.string().min(1);
export const avatar = z.string().min(1);
export const email = z.string().email();
export const subtitle = z.string().min(1);
export const pollId = z.number();
export const title = z.string().min(1);
export const uids = z.array(uid);
export const searchUserQuery = z.string().min(1);
