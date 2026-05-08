import { AiOutlineLoading3Quarters } from "react-icons/ai";

type EditorFooterProps = {
  handleRun: () => void;
  handleSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
};

const EditorFooter: React.FC<EditorFooterProps> = ({
  handleRun,
  handleSubmit,
  isRunning,
  isSubmitting,
}) => {
  return (
    <div className="flex bg-dark-layer-1 absolute bottom-0 z-10 w-full border-t border-dark-fill-3">
      <div className="mx-5 my-[10px] flex justify-between w-full">
        <div className="flex flex-1 items-center gap-2">
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-1.5 font-medium items-center transition-all
            inline-flex text-sm text-white bg-dark-fill-3
            hover:bg-dark-fill-2 rounded-lg disabled:opacity-50 gap-2"
          >
            {isRunning ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Running...
              </>
            ) : (
              "▶ Run"
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 font-medium items-center transition-all
            inline-flex text-sm text-white bg-dark-green-s
            hover:bg-green-600 rounded-lg disabled:opacity-50 gap-2"
          >
            {isSubmitting ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorFooter;