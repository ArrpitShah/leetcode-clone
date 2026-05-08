import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import Topbar from "@/components/Topbar/Topbar";
import { AiOutlinePlus, AiOutlineLoading3Quarters, AiOutlineClockCircle } from "react-icons/ai";
import { toast } from "react-toastify";

type Contest = {
	id: string;
	title: string;
	description: string;
	start_time: string;
	duration_mins: number;
};

export default function ContestsPage() {
	const [contests, setContests] = useState<Contest[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [user, setUser] = useState<any>(null);
	
	const [newContest, setNewContest] = useState({
		title: "",
		description: "",
		start_time: "",
		duration_mins: 60,
		difficulty: "Medium",
		topic: "All",
	});

	const router = useRouter();

	useEffect(() => {
		const fetchContests = async () => {
			setLoading(true);
			const { data } = await supabase.from("contests").select("*").order("start_time", { ascending: false });
			if (data) setContests(data);
			setLoading(false);
		};
		
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});

		fetchContests();
	}, []);

	const handleCreateContest = async () => {
		if (!newContest.title || !newContest.start_time) {
			toast.error("Please fill all fields");
			return;
		}

		// Auto-select problems based on difficulty and topic
		let query = supabase.from("problems").select("id");
		if (newContest.difficulty !== "All") {
			const mappedDiff = newContest.difficulty === "Basic" ? "Easy" : newContest.difficulty;
			query = query.eq("difficulty", mappedDiff);
		}
		if (newContest.topic !== "All") {
			query = query.eq("category", newContest.topic);
		}

		const { data: selectedProbs, error: fetchError } = await query.limit(5);

		if (fetchError || !selectedProbs || selectedProbs.length === 0) {
			toast.error("No problems found for the selected criteria");
			return;
		}

		const { data, error } = await supabase.from("contests").insert({
			title: newContest.title,
			description: newContest.description,
			start_time: newContest.start_time,
			duration_mins: newContest.duration_mins,
			created_by: user.id
		}).select().single();

		if (error) {
			toast.error(error.message);
			return;
		}

		const problemInserts = selectedProbs.map(p => ({
			contest_id: data.id,
			problem_id: p.id,
			points: 10 // Default points
		}));

		const { error: pError } = await supabase.from("contest_problems").insert(problemInserts);
		
		if (pError) {
			toast.error("Contest created but failed to add problems");
		} else {
			toast.success(`Contest created with ${selectedProbs.length} problems!`);
			setShowCreateModal(false);
			setContests([data, ...contests]);
		}
	};

	const TOPICS = [
		"All", "Array", "String", "Linked List", "Stack", "Queue",
		"Tree", "Graph", "Dynamic Programming", "Binary Search",
		"Sorting", "Hashing", "General",
	];

	const LEVELS = ["Basic", "Medium", "Hard"];


	return (
		<div className='min-h-screen bg-dark-layer-2'>
			<Topbar />
			<main className='max-w-6xl mx-auto p-4 sm:p-6'>
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
					<h1 className='text-2xl sm:text-3xl font-bold text-white'>Contests</h1>
					<button 
						onClick={() => setShowCreateModal(true)}
						className='w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-s text-white px-4 py-2 rounded-lg transition-colors'
					>
						<AiOutlinePlus /> Create Contest
					</button>
				</div>

				{loading ? (
					<div className='flex justify-center mt-20'>
						<AiOutlineLoading3Quarters className='animate-spin text-white text-4xl' />
					</div>
				) : (
					<div className='grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
						{contests.map((c) => (
							<div key={c.id} className='bg-dark-layer-1 p-5 sm:p-6 rounded-2xl border border-dark-fill-3 hover:border-brand-orange transition-all cursor-pointer'
								onClick={() => router.push(`/contests/${c.id}`)}>
								<h2 className='text-lg sm:text-xl font-bold text-white mb-2 truncate'>{c.title}</h2>
								<p className='text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2'>{c.description}</p>
								<div className='flex items-center justify-between text-[10px] sm:text-xs text-gray-500'>
									<div className='flex items-center gap-1'>
										<AiOutlineClockCircle />
										{new Date(c.start_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
									</div>
									<div className='bg-dark-fill-3 px-2 py-1 rounded'>{c.duration_mins} mins</div>
								</div>
							</div>
						))}
					</div>
				)}
			</main>

			{/* Create Modal */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4'>
					<div className='bg-dark-layer-1 w-full max-w-lg rounded-2xl p-6 border border-dark-fill-3 max-h-[90vh] overflow-y-auto'>
						<h2 className='text-xl font-bold text-white mb-6'>Create New Contest</h2>
						
						<div className='space-y-4'>
							<div>
								<label className='text-xs text-gray-400 block mb-1'>Contest Title</label>
								<input 
									className='w-full bg-dark-fill-3 text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-brand-orange'
									value={newContest.title}
									onChange={e => setNewContest({...newContest, title: e.target.value})}
								/>
							</div>
							<div>
								<label className='text-xs text-gray-400 block mb-1'>Description</label>
								<textarea 
									className='w-full bg-dark-fill-3 text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-brand-orange resize-none h-20'
									value={newContest.description}
									onChange={e => setNewContest({...newContest, description: e.target.value})}
								/>
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='text-xs text-gray-400 block mb-1'>Start Time</label>
									<input 
										type="datetime-local"
										className='w-full bg-dark-fill-3 text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-brand-orange'
										value={newContest.start_time}
										onChange={e => setNewContest({...newContest, start_time: e.target.value})}
									/>
								</div>
								<div>
									<label className='text-xs text-gray-400 block mb-1'>Duration (mins)</label>
									<input 
										type="number"
										className='w-full bg-dark-fill-3 text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-brand-orange'
										value={newContest.duration_mins}
										onChange={e => setNewContest({...newContest, duration_mins: parseInt(e.target.value)})}
									/>
								</div>
							</div>
							
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='text-xs text-gray-400 block mb-1'>Level</label>
									<select 
										className='w-full bg-dark-fill-3 text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-brand-orange appearance-none'
										value={newContest.difficulty}
										onChange={e => setNewContest({...newContest, difficulty: e.target.value})}
									>
										{LEVELS.map(l => (
											<option key={l} value={l}>{l}</option>
										))}
									</select>
								</div>
								<div>
									<label className='text-xs text-gray-400 block mb-1'>Topic</label>
									<select 
										className='w-full bg-dark-fill-3 text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-brand-orange appearance-none'
										value={newContest.topic}
										onChange={e => setNewContest({...newContest, topic: e.target.value})}
									>
										{TOPICS.map(t => (
											<option key={t} value={t}>{t}</option>
										))}
									</select>
								</div>
							</div>
						</div>

						<div className='flex gap-3 mt-8'>
							<button 
								onClick={() => setShowCreateModal(false)}
								className='flex-1 py-2 text-gray-400 hover:text-white transition-colors'
							>
								Cancel
							</button>
							<button 
								onClick={handleCreateContest}
								className='flex-1 bg-brand-orange hover:bg-brand-orange-s text-white py-2 rounded-lg font-medium transition-colors'
							>
								Create
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
