import { atom } from "recoil";

export type ContestState = {
	isInContest: boolean;
	contestId: string | null;
	startTime: number | null;
};

export const contestState = atom<ContestState>({
	key: "contestState",
	default: {
		isInContest: false,
		contestId: null,
		startTime: null,
	},
});
