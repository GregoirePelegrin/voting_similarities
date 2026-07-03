import {apiFetch} from "./client";
import {VoteOut, VoteDetailOut} from "./types";

export function getVotes(): Promise<VoteOut[]> {
  return apiFetch("/votes");
}

export function getVote(id: number): Promise<VoteDetailOut> {
  return apiFetch(`/votes/${id}`);
}
