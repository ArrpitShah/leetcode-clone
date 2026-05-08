import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { AiOutlineLoading3Quarters, AiOutlinePlus, AiOutlineBulb } from "react-icons/ai";
import { toast } from "react-toastify";

type Hint = {
	id: string;
	user_id: string;
	user_email: string;
	content: string;
	created_at: string;
};

type ProblemEditorialProps = {
	problemId: string;
};

const ProblemEditorial: React.FC<ProblemEditorialProps> = ({ problemId }) => {
	const [hints, setHints] = useState<Hint[]>([]);
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<any>(null);
	const [newHint, setNewHint] = useState("");
	const [adding, setAdding] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});

		const fetchHints = async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from("problem_hints")
				.select("*")
				.eq("problem_id", problemId)
				.order("created_at", { ascending: true });

			if (!error && data) setHints(data);
			setLoading(false);
		};

		fetchHints();
	}, [problemId]);

	const handleAddHint = async () => {
		if (!user) {
			toast.error("Please login to add a hint");
			return;
		}
		if (!newHint.trim()) return;

		setAdding(true);
		const { data, error } = await supabase
			.from("problem_hints")
			.insert({
				problem_id: problemId,
				user_id: user.id,
				user_email: user.email,
				content: newHint.trim(),
			})
			.select()
			.single();

		if (!error && data) {
			setHints([...hints, data]);
			setNewHint("");
			setShowAddForm(false);
			toast.success("Hint added!");
		} else {
			toast.error(error?.message || "Failed to add hint");
		}
		setAdding(false);
	};

	return (
		<div className='h-[calc(100vh-94px)] overflow-y-auto p-5'>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-white text-xl font-bold flex items-center gap-2'>
					<AiOutlineBulb className='text-yellow-500' /> Hints & Solutions
				</h2>
				<button
					onClick={() => setShowAddForm(!showAddForm)}
					className='flex items-center gap-2 bg-dark-fill-3 hover:bg-dark-fill-2 text-white px-4 py-2 rounded-lg text-sm transition-all'
				>
					<AiOutlinePlus /> {showAddForm ? "Cancel" : "Add Hint"}
				</button>
			</div>

			{showAddForm && (
				<div className='bg-dark-layer-2 border border-dark-fill-3 rounded-xl p-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300'>
					<label className='text-xs text-gray-400 uppercase tracking-wider block mb-2'>
						Share a solution hint or approach
					</label>
					<textarea
						value={newHint}
						onChange={(e) => setNewHint(e.target.value)}
						placeholder='Explain the logic, time complexity, or a key step...'
						className='w-full bg-dark-fill-3 text-white text-sm px-4 py-3 rounded-lg outline-none border border-transparent focus:border-brand-orange resize-none h-32'
					/>
					<div className='flex justify-end mt-3'>
						<button
							onClick={handleAddHint}
							disabled={adding || !newHint.trim()}
							className='bg-brand-orange hover:bg-brand-orange-s text-white px-6 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2'
						>
							{adding ? <AiOutlineLoading3Quarters className='animate-spin' /> : "Post Hint"}
						</button>
					</div>
				</div>
			)}

			{loading ? (
				<div className='flex justify-center mt-10'>
					<AiOutlineLoading3Quarters className='animate-spin text-white text-2xl' />
				</div>
			) : hints.length === 0 ? (
				<div className='text-center py-20 bg-dark-layer-2 rounded-2xl border border-dashed border-dark-fill-3'>
					<div className='text-5xl mb-4'>💡</div>
					<h3 className='text-white font-medium mb-1'>No hints yet</h3>
					<p className='text-gray-500 text-sm'>Be the first to share an approach!</p>
				</div>
			) : (
				<div className='space-y-4'>
					{hints.map((hint, index) => (
						<div key={hint.id} className='bg-dark-layer-2 border border-dark-fill-3 rounded-2xl p-6 hover:border-brand-orange/30 transition-all group'>
							<div className='flex items-center gap-3 mb-4'>
								<div className='bg-brand-orange/10 text-brand-orange w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs'>
									{index + 1}
								</div>
								<div>
									<div className='text-white text-sm font-medium'>
										Hint {index + 1}
									</div>
									<div className='text-[10px] text-gray-500 uppercase tracking-tighter'>
										Shared by {hint.user_email.split("@")[0]} • {new Date(hint.created_at).toLocaleDateString()}
									</div>
								</div>
							</div>
							<p className='text-gray-300 text-sm leading-relaxed whitespace-pre-wrap'>
								{hint.content}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ProblemEditorial;
