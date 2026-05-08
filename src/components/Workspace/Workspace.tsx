import { useState } from "react";
import Split from "react-split";
import ProblemDescription from "./ProblemDescription/ProblemDescription";
import Playground, { SubmitResult } from "./Playground/Playground";
import { Problem } from "@/utils/types/problem";
import Confetti from "react-confetti";
import useWindowSize from "@/hooks/useWindowSize";
import { FiStar } from "react-icons/fi"; // Import FiStar icon

type WorkspaceProps = {
  problem: Problem;
  user: any; // User object
  starredProblems: string[]; // Array of starred problem IDs
  handleToggleBookmark: (problemId: string) => Promise<void>; // Bookmark handler function
  currentProblemId: string; // The ID of the current problem
};

const Workspace: React.FC<WorkspaceProps> = ({
  problem,
  user,
  starredProblems,
  handleToggleBookmark,
  currentProblemId,
}) => {
  const { width, height } = useWindowSize();
  const [success, setSuccess] = useState(false);
  const [solved, setSolved] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const isStarred = starredProblems.includes(currentProblemId); // Check if current problem is starred

  const handleSubmitResult = (result: SubmitResult) => {
    setSubmitResult(result);
  };

  return (
    <>
      <Split
        className="split h-[calc(100vh-50px)]"
        minSize={0}
        direction={width < 768 ? "vertical" : "horizontal"}
      >
        <ProblemDescription
          problem={problem}
          _solved={solved}
          submitResult={submitResult}
          onClearResult={() => setSubmitResult(null)}
          // Pass bookmark props to ProblemDescription if needed, or handle directly here if preferred
          // For now, let's assume bookmarking might be a global action for the problem view
          user={user}
          isStarred={isStarred}
          handleToggleBookmark={handleToggleBookmark}
          currentProblemId={currentProblemId}
        />
        <div className="bg-dark-fill-2 overflow-hidden">
          <Playground
            problem={problem}
            setSuccess={setSuccess}
            setSolved={setSolved}
            onSubmitResult={handleSubmitResult}
          />
          {success && (
            <Confetti
              gravity={0.3}
              tweenDuration={4000}
              width={width - 1}
              height={height - 1}
            />
          )}
        </div>
      </Split>
    </>
  );
};

export default Workspace;