import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/supabase/supabase";
import Topbar from "@/components/Topbar/Topbar";
import { AiOutlineClockCircle, AiOutlineLock, AiOutlineLoading3Quarters } from "react-icons/ai";
import { useRecoilState } from "recoil";
import { contestState } from "@/atoms/contestAtom";
import Link from "next/link";
import { BsCheckCircleFill } from "react-icons/bs";

type Problem = {
	id: string;
	title: string;
	difficulty: string;
	category: string;
};

type Contest = {
	id: string;
	title: string;
	description: string;
	start_time: string;
	duration_mins: number;
};

export default function ContestDetailPage() {
	const router = useRouter();
	const { id } = router.query;
	const [contest, setContest] = useState<Contest | null>(null);
	const [problems, setProblems] = useState<Problem[]>([]);
	const [loading, setLoading] = useState(true);
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [isStarted, setIsStarted] = useState(false);
	const [isEnded, setIsEnded] = useState(false);
	const [recoilContest, setRecoilContest] = useRecoilState(contestState);


	useEffect(() => {
		if (!id) return;

		const fetchContestData = async () => {
			setLoading(true);
			const { data: contestData, error: cError } = await supabase
				.from("contests")
				.select("*")
				.eq("id", id)
				.single();

			if (cError || !contestData) {
				router.push("/contests");
				return;
			}

			setContest(contestData);

			const { data: problemData } = await supabase
				.from("contest_problems")
				.select("problems(*)")
				.eq("contest_id", id);

			if (problemData) {
				setProblems(problemData.map((p: any) => p.problems));
			}
			setLoading(false);
		};

		fetchContestData();
	}, [id, router]);

	useEffect(() => {
		if (!contest) return;

		const timer = setInterval(() => {
			const now = new Date().getTime();
			const start = new Date(contest.start_time).getTime();
			const end = start + contest.duration_mins * 60 * 1000;
			
			if (now < start) {
				setIsStarted(false);
				setIsEnded(false);
				setTimeLeft(Math.floor((start - now) / 1000));
				setRecoilContest({ isInContest: false, contestId: null, startTime: null });
			} else if (now < end) {
				setIsStarted(true);
				setIsEnded(false);
				setTimeLeft(Math.floor((end - now) / 1000));
				setRecoilContest({
					isInContest: true,
					contestId: contest.id,
					startTime: start,
				});
			} else {
				setIsStarted(false);
				setIsEnded(true);
				setTimeLeft(0);
				clearInterval(timer);
				setRecoilContest({ isInContest: false, contestId: null, startTime: null });
			}
		}, 1000);

		return () => {
			clearInterval(timer);
			setRecoilContest({ isInContest: false, contestId: null, startTime: null });
		};
	}, [contest, setRecoilContest]);


	const formatTime = (seconds: number) => {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	if (loading) return (
		<div className='min-h-screen bg-dark-layer-2 flex items-center justify-center'>
			<AiOutlineLoading3Quarters className='animate-spin text-white text-4xl' />
		</div>
	);

	if (!contest) return null;

	return (
		<div className='min-h-screen bg-dark-layer-2'>
			<Topbar />
			<main className='max-w-4xl mx-auto p-6'>
				<div className='bg-dark-layer-1 rounded-2xl p-8 border border-dark-fill-3 mb-8'>
					<div className='flex justify-between items-start mb-6'>
						<div>
							<h1 className='text-3xl font-bold text-white mb-2'>{contest.title}</h1>
							<p className='text-gray-400'>{contest.description}</p>
						</div>
						<div className='bg-dark-fill-3 px-4 py-2 rounded-xl border border-dark-fill-2 text-center'>
							<div className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
								{isEnded ? "Status" : isStarted ? "Time Remaining" : "Starts In"}
							</div>
							<div className={`text-2xl font-mono font-bold ${isStarted ? "text-brand-orange" : isEnded ? "text-red-500" : "text-white"}`}>
								{isEnded ? "Ended" : formatTime(timeLeft)}
							</div>
						</div>
					</div>

					<div className='flex gap-6 text-sm'>
						<div className='flex items-center gap-2 text-gray-400'>
							<AiOutlineClockCircle className='text-brand-orange' />
							<span>{new Date(contest.start_time).toLocaleString()}</span>
						</div>
						<div className='flex items-center gap-2 text-gray-400'>
							<div className='w-2 h-2 rounded-full bg-brand-orange' />
							<span>{contest.duration_mins} Minutes</span>
						</div>
					</div>
				</div>

				<div className='bg-dark-layer-1 rounded-2xl border border-dark-fill-3 overflow-hidden'>
					<div className='px-6 py-4 border-b border-dark-fill-3 flex justify-between items-center bg-dark-fill-3/20'>
						<h2 className='text-xl font-bold text-white'>Problems</h2>
						{!isStarted && (
							<div className='flex items-center gap-2 text-amber-500 text-sm font-medium'>
								<AiOutlineLock />
								Locked until start
							</div>
						)}
					</div>

					<div className='divide-y divide-dark-fill-3'>
						{problems.map((problem, idx) => (
							<div key={problem.id} className={`p-6 flex items-center justify-between transition-all ${
								isStarted ? "hover:bg-dark-fill-3 cursor-pointer" : "opacity-50 grayscale"
							}`}
							onClick={() => isStarted && router.push(`/problems/${problem.id}`)}>
								<div className='flex items-center gap-4'>
									<div className='text-gray-500 font-mono w-4'>{idx + 1}</div>
									<div>
										<h3 className='text-white font-medium hover:text-brand-orange transition-colors'>
											{problem.title}
										</h3>
										<div className='flex gap-3 mt-1'>
											<span className={`text-[10px] uppercase font-bold ${
												problem.difficulty === "Easy" ? "text-green-500" :
												problem.difficulty === "Medium" ? "text-yellow-500" : "text-red-500"
											}`}>
												{problem.difficulty}
											</span>
											<span className='text-[10px] text-gray-500 uppercase font-bold'>
												{problem.category}
											</span>
										</div>
									</div>
								</div>
								
								{isStarted ? (
									<button className='bg-brand-orange/10 text-brand-orange px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-orange hover:text-white transition-all'>
										Solve
									</button>
								) : (
									<AiOutlineLock className='text-gray-600 text-xl' />
								)}
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
