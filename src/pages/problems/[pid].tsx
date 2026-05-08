import Topbar from "@/components/Topbar/Topbar";
import Workspace from "@/components/Workspace/Workspace";
import useHasMounted from "@/hooks/useHasMounted";
import { problems } from "@/utils/problems";
import { Problem } from "@/utils/types/problem";
import React, { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabase"; // Import supabase
import { FiStar } from "react-icons/fi"; // Import FiStar icon

type ProblemPageProps = {
	problem: Problem;
};

const ProblemPage: React.FC<ProblemPageProps> = ({ problem }) => {
	const hasMounted = useHasMounted();

	const [user, setUser] = useState<any>(null);
	const [starredProblems, setStarredProblems] = useState<string[]>([]);

	// Fetch user and their starred problems
	useEffect(() => {
		const loadUserData = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			setUser(session?.user ?? null);
			if (session?.user) {
				fetchStarredProblems(session.user.id);
			}

			const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
				setUser(session?.user ?? null);
				if (session?.user) {
					fetchStarredProblems(session.user.id);
				} else {
					setStarredProblems([]); // Clear starred problems if user logs out
				}
			});
			return () => subscription.unsubscribe();
		};
		loadUserData();
	}, []);

	// Function to fetch starred problems
	const fetchStarredProblems = async (userId: string) => {
		const { data, error } = await supabase
			.from('user_starred_problems')
			.select('problem_id')
			.eq('user_id', userId);

		if (!error && data) {
			setStarredProblems(data.map((d: any) => d.problem_id));
		} else {
			console.error('Error fetching starred problems:', error);
		}
	};

	// Function to toggle bookmark (adapted from ProblemsTable)
	const handleToggleBookmark = async (problemId: string) => {
		if (!user) {
			alert('Please log in to bookmark problems.');
			return;
		}

		const isStarred = starredProblems.includes(problemId);

		try {
			let dbError = null;
			if (isStarred) {
				// Remove bookmark
				const { error } = await supabase
					.from('user_starred_problems')
					.delete()
					.eq('user_id', user.id)
					.eq('problem_id', problemId);
				dbError = error;
			} else {
				// Add bookmark
				const { error } = await supabase
					.from('user_starred_problems')
					.insert([
						{ user_id: user.id, problem_id: problemId },
					]);
				dbError = error;
			}

			if (dbError) {
				console.error('Error toggling bookmark:', dbError);
				alert('Failed to update bookmark status. Please try again.');
			} else {
				// Update local state
				setStarredProblems(prev =>
					isStarred
						? prev.filter(id => id !== problemId)
						: [...prev, problemId]
				);
			}
		} catch (error) {
			console.error('An unexpected error occurred:', error);
			alert('An unexpected error occurred.');
		}
	};

	if (!hasMounted) return null;

	return (
		<div>
			<Topbar problemPage />
			<Workspace
				problem={problem}
				user={user} // Pass user to Workspace
				starredProblems={starredProblems} // Pass starred problems to Workspace
				handleToggleBookmark={handleToggleBookmark} // Pass handler to Workspace
				currentProblemId={problem.id} // Pass current problem ID
			/>
		</div>
	);
};
export default ProblemPage;

// fetch the local data
//  SSG
// getStaticPaths => it create the dynamic routes
export async function getStaticPaths() {
	const paths = Object.keys(problems).map((key) => ({
		params: { pid: key },
	}));

	return {
		paths,
		fallback: false,
	};
}

// getStaticProps => it fetch the data

export async function getStaticProps({ params }: { params: { pid: string } }) {
	const { pid } = params;
	const problem = problems[pid];

	if (!problem) {
		return {
			notFound: true,
		};
	}
	const serializableProblem = { ...problem };
    delete serializableProblem.handlerFunction;

	return {
		props: {
			problem: serializableProblem, // Pass the serializable version
		},
	};
}
