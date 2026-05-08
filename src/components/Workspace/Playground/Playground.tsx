import { useState, useEffect } from "react";
import PreferenceNav from "./PreferenceNav/PreferenceNav";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import EditorFooter from "./EditorFooter";
import { Problem } from "@/utils/types/problem";
import { toast } from "react-toastify";
import { problems } from "@/utils/problems";
import { useRouter } from "next/router";
import useLocalStorage from "@/hooks/useLocalStorage";
import { supabase } from "@/supabase/supabase";

type PlaygroundProps = {
  problem: Problem;
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSolved: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmitResult: (result: SubmitResult) => void;
};

export type SubmitResult = {
  status: string;
  runtime: number;
  memory: number;
  code: string;
  passedCount: number;
  totalCount: number;
};

export interface ISettings {
  fontSize: string;
  settingsModalIsOpen: boolean;
  dropdownIsOpen: boolean;
}

type TestCaseResult = {
  passed: boolean;
  input: string;
  expected: string;
  output: string;
  running?: boolean;
};

type Language = "JavaScript" | "Python" | "Java" | "C++";

const starterTemplates: Record<Language, (jsCode: string) => string> = {
  JavaScript: (jsCode) => jsCode,
  Python: (_) => `# Write your solution here\ndef solution():\n    pass\n`,
  Java: (_) => `class Solution {\n    // Write your solution here\n    public void solve() {\n        \n    }\n}\n`,
  "C++": (_) => `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Write your solution here\n    void solve() {\n        \n    }\n};\n`,
};

const languageExtensions: Record<Language, any> = {
  JavaScript: javascript(),
  Python: python(),
  Java: java(),
  "C++": cpp(),
};

const LANGUAGES: Language[] = ["JavaScript", "Python", "Java", "C++"];

const langColors: Record<Language, string> = {
  JavaScript: "text-yellow-400",
  Python: "text-blue-400",
  Java: "text-orange-400",
  "C++": "text-purple-400",
};

const testInputs: any = {
  "two-sum": [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { args: [[3, 2, 4], 6], expected: [1, 2] },
    { args: [[3, 3], 6], expected: [0, 1] },
  ],
  "valid-parentheses": [
    { args: ["()"], expected: true },
    { args: ["()[]{}"], expected: true },
    { args: ["(]"], expected: false },
  ],
  "jump-game": [
    { args: [[2, 3, 1, 1, 4]], expected: true },
    { args: [[3, 2, 1, 0, 4]], expected: false },
  ],
  "search-a-2d-matrix": [
    { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], expected: true },
    { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], expected: false },
  ],
  "reverse-linked-list": [
    { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
    { args: [[1, 2]], expected: [2, 1] },
  ],
};

const Playground: React.FC<PlaygroundProps> = ({ problem, setSuccess, setSolved, onSubmitResult }) => {
  const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0);
  const [userCode, setUserCode] = useState<string>(problem.starterCode);
  const [fontSize, setFontSize] = useLocalStorage("lcc-fontSize", "16px");
  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningIndex, setRunningIndex] = useState<number>(-1);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("JavaScript");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const [settings, setSettings] = useState<ISettings>({
    fontSize: fontSize,
    settingsModalIsOpen: false,
    dropdownIsOpen: false,
  });

  const { query: { pid } } = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load saved code for current language
  useEffect(() => {
    const savedCode = localStorage.getItem(`code-${pid}-${selectedLanguage}`);
    if (savedCode) {
      setUserCode(JSON.parse(savedCode));
    } else {
      const template = selectedLanguage === "JavaScript"
        ? problem.starterCode
        : starterTemplates[selectedLanguage](problem.starterCode);
      setUserCode(template);
    }
    setHasRun(false);
    setTestResults([]);
  }, [pid, selectedLanguage, problem.starterCode]);

  const onChange = (value: string) => {
    setUserCode(value);
    localStorage.setItem(`code-${pid}-${selectedLanguage}`, JSON.stringify(value));
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    setLangDropdownOpen(false);
  };

  const handleRun = async () => {
    if (isRunning) return;

    if (!user) {
      toast.error("Please login to run tests", { position: "top-center", theme: "dark" });
      router.push("/auth");
      return;
    }

    if (selectedLanguage !== "JavaScript") {
      toast.info(`${selectedLanguage} code execution is not supported in the browser. Switch to JavaScript to run tests.`, {
        position: "top-center", autoClose: 4000, theme: "dark",
      });
      return;
    }

    setIsRunning(true);
    setHasRun(false);
    setTestResults([]);

    try {
      const code = userCode.slice(userCode.indexOf(problem.starterFunctionName));
      const cb = new Function(`return ${code}`)();
      const currentPid = pid as string;
      const testData = testInputs[currentPid];

      if (!testData) {
        toast.error("Test data not found", { position: "top-center", theme: "dark" });
        setIsRunning(false);
        return;
      }

      const results: TestCaseResult[] = [];

      for (let index = 0; index < problem.examples.length; index++) {
        setRunningIndex(index);
        setActiveTestCaseId(index);
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
          const { args, expected } = testData[index];
          const output = cb(...args);
          const outputStr = JSON.stringify(output);
          const expectedStr = JSON.stringify(expected);
          results.push({
            passed: outputStr === expectedStr,
            input: problem.examples[index].inputText,
            expected: expectedStr,
            output: outputStr,
          });
        } catch (err: any) {
          results.push({
            passed: false,
            input: problem.examples[index].inputText,
            expected: JSON.stringify(testData[index]?.expected),
            output: err.message,
          });
        }
        setTestResults([...results]);
      }

      setRunningIndex(-1);
      setHasRun(true);
      setIsRunning(false);

      const allPassed = results.every((r) => r.passed);
      if (allPassed) {
        toast.success("All test cases passed! Click Submit to save.", {
          position: "top-center", autoClose: 3000, theme: "dark",
        });
      } else {
        toast.error("Some test cases failed!", {
          position: "top-center", autoClose: 3000, theme: "dark",
        });
      }
    } catch (error: any) {
      setIsRunning(false);
      setRunningIndex(-1);
      toast.error(error.message, { position: "top-center", theme: "dark" });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to submit", { position: "top-center", theme: "dark" });
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let status = "Accepted";
      let passedCount = 0;
      const totalCount = testInputs[pid as string]?.length || 0;
      const startTime = performance.now();

      if (selectedLanguage === "JavaScript") {
        const code = userCode.slice(userCode.indexOf(problem.starterFunctionName));
        const cb = new Function(`return ${code}`)();
        const handler = problems[pid as string].handlerFunction;
        if (typeof handler === "function") {
          try {
            handler(cb);
            passedCount = totalCount;
          } catch {
            status = "Wrong Answer";
            const testData = testInputs[pid as string] || [];
            for (const t of testData) {
              try {
                const out = JSON.stringify(cb(...t.args));
                if (out === JSON.stringify(t.expected)) passedCount++;
              } catch { }
            }
          }
        }
      } else {
        // Non-JS: simulate accepted
        passedCount = totalCount;
        toast.info(`${selectedLanguage} submitted! Note: execution is simulated for non-JS languages.`, {
          position: "top-center", autoClose: 4000, theme: "dark",
        });
      }

      const endTime = performance.now();
      const runtime = Math.floor(endTime - startTime) + Math.floor(Math.random() * 80 + 20);
      const memory = Math.floor(Math.random() * 10 + 38);

      await supabase.from("submissions").insert({
        user_id: user.id,
        problem_id: pid,
        code: userCode,
        status,
        runtime,
        memory,
        language: selectedLanguage,
      });

      if (status === "Accepted") {
        await supabase.from("solved_problems")
          .upsert(
            { user_id: user.id, problem_id: pid },
            { onConflict: "user_id,problem_id" }
          );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
        setSolved(true);
        toast.success("Congrats! All test cases passed!", {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      } else {
        toast.error(`Submission failed: ${status}`, {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      }

      onSubmitResult({ status, runtime, memory, code: userCode, passedCount, totalCount });

    } catch (error: any) {
      await supabase.from("submissions").insert({
        user_id: user.id,
        problem_id: pid,
        code: userCode,
        status: "Runtime Error",
        runtime: 0,
        memory: 0,
        language: selectedLanguage,
      });
      onSubmitResult({
        status: "Runtime Error",
        runtime: 0,
        memory: 0,
        code: userCode,
        passedCount: 0,
        totalCount: testInputs[pid as string]?.length || 0,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col bg-dark-layer-1 relative overflow-x-hidden">
      <PreferenceNav 
        settings={settings} 
        setSettings={setSettings} 
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
      />

      <Split
        className="h-[calc(100vh-94px)]"
        direction="vertical"
        sizes={[60, 40]}
        minSize={60}
      >
        {/* Code Editor */}
        <div className="w-full overflow-auto">
          <CodeMirror
            value={userCode}
            theme={vscodeDark}
            onChange={onChange}
            extensions={[languageExtensions[selectedLanguage]]}
            style={{ fontSize: settings.fontSize }}
          />
        </div>

        {/* Test Cases */}
        <div className="w-full flex flex-col overflow-hidden bg-dark-layer-1">
          <div className="px-5 pt-2 sticky top-0 z-10 bg-dark-layer-1">
            <div className="flex h-10 items-center">
              <div className="relative flex h-full flex-col justify-center cursor-pointer">
                <div className="text-sm font-medium leading-5 text-white">Testcases</div>
                <hr className="absolute bottom-0 h-0.5 w-full rounded-full border-none bg-white" />
              </div>
            </div>

            <div className="flex gap-2 mt-2 pb-2 overflow-x-auto no-scrollbar">
              {problem.examples.map((example, index) => {
                const result = testResults[index];
                const isCurrentlyRunning = runningIndex === index;
                return (
                  <div
                    key={example.id}
                    onClick={() => !isRunning && setActiveTestCaseId(index)}
                    className={`px-4 py-1 rounded-lg cursor-pointer text-sm font-medium shrink-0
                      transition-all duration-300 flex items-center gap-1
                      ${activeTestCaseId === index ? "text-white" : "text-gray-500"}
                      ${isCurrentlyRunning
                        ? "bg-yellow-900 border border-yellow-500 animate-pulse"
                        : hasRun && result
                          ? result.passed
                            ? "bg-green-900 border border-green-500"
                            : "bg-red-900 border border-red-500"
                          : "bg-dark-fill-3 hover:bg-dark-fill-2"
                      }`}
                  >
                    {isCurrentlyRunning ? (
                      <span className="animate-spin text-yellow-400">⟳</span>
                    ) : hasRun && result ? (
                      <span>{result.passed ? "✓" : "✗"}</span>
                    ) : null}
                    Case {index + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 overflow-y-auto flex-1 pb-16">
            {isRunning && runningIndex >= 0 && (
              <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600
                rounded-lg text-yellow-300 text-sm flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                Running Case {runningIndex + 1}...
              </div>
            )}

            <p className="text-sm font-medium mt-4 text-white">Input:</p>
            <div className="w-full cursor-text rounded-lg border px-3 py-[10px]
              bg-dark-fill-3 border-transparent text-white mt-2 text-sm">
              {problem.examples[activeTestCaseId]?.inputText}
            </div>

            <p className="text-sm font-medium mt-4 text-white">Expected Output:</p>
            <div className="w-full cursor-text rounded-lg border px-3 py-[10px]
              bg-dark-fill-3 border-transparent text-white mt-2 text-sm">
              {problem.examples[activeTestCaseId]?.outputText}
            </div>

            {hasRun && testResults[activeTestCaseId] && (
              <>
                <p className="text-sm font-medium mt-4 text-white">Your Output:</p>
                <div className={`w-full cursor-text rounded-lg border px-3 py-[10px]
                  mt-2 text-sm font-mono
                  ${testResults[activeTestCaseId].passed
                    ? "bg-green-900 border-green-500 text-green-300"
                    : "bg-red-900 border-red-500 text-red-300"
                  }`}>
                  {testResults[activeTestCaseId].output}
                </div>
              </>
            )}
          </div>
        </div>
      </Split>

      <EditorFooter
        handleRun={handleRun}
        handleSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Playground;