import { useState, useEffect } from "react";
import { AiOutlineFullscreen, AiOutlineFullscreenExit, AiOutlineSetting } from "react-icons/ai";
import { ISettings } from "../Playground";
import SettingsModal from "@/components/Modals/SettingsModal";

type PreferenceNavProps = {
	settings: ISettings;
	setSettings: React.Dispatch<React.SetStateAction<ISettings>>;
	selectedLanguage: string;
	setSelectedLanguage: (lang: any) => void;
};

const langColors: Record<string, string> = {
	JavaScript: "text-yellow-400",
	Python: "text-blue-400",
	Java: "text-orange-400",
	"C++": "text-purple-400",
};

const PreferenceNav: React.FC<PreferenceNavProps> = ({ setSettings, settings, selectedLanguage, setSelectedLanguage }) => {
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [langDropdownOpen, setLangDropdownOpen] = useState(false);

	const handleFullScreen = () => {
		if (isFullScreen) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
		setIsFullScreen(!isFullScreen);
	};

	useEffect(() => {
		function exitHandler(e: any) {
			if (!document.fullscreenElement) {
				setIsFullScreen(false);
				return;
			}
			setIsFullScreen(true);
		}

		if (document.addEventListener) {
			document.addEventListener("fullscreenchange", exitHandler);
			document.addEventListener("webkitfullscreenchange", exitHandler);
			document.addEventListener("mozfullscreenchange", exitHandler);
			document.addEventListener("MSFullscreenChange", exitHandler);
		}
	}, [isFullScreen]);

	return (
		<div className='flex items-center justify-between bg-dark-layer-2 h-11 w-full '>
			<div className='flex items-center text-white gap-3 px-2'>
				<div className='relative'>
					<button 
						onClick={() => setLangDropdownOpen(!langDropdownOpen)}
						className='flex cursor-pointer items-center rounded focus:outline-none bg-dark-fill-3 text-dark-label-2 hover:bg-dark-fill-2 px-2 py-1.5 font-medium transition-all gap-2'
					>
						<div className={`text-xs ${langColors[selectedLanguage] || "text-dark-label-2"}`}>
							{selectedLanguage}
						</div>
						<span className='text-gray-400 text-[10px]'>{langDropdownOpen ? "▲" : "▼"}</span>
					</button>

					{langDropdownOpen && (
						<div className='absolute top-full left-0 mt-1 bg-dark-layer-1 border border-dark-fill-3 rounded-lg overflow-hidden z-50 min-w-[120px] shadow-2xl'>
							{["JavaScript", "Python", "Java", "C++"].map((lang) => (
								<button
									key={lang}
									onClick={() => {
										setSelectedLanguage(lang);
										setLangDropdownOpen(false);
									}}
									className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-dark-fill-3 ${
										langColors[lang] || "text-gray-300"
									} ${selectedLanguage === lang ? "bg-dark-fill-3" : ""}`}
								>
									{lang}
								</button>
							))}
						</div>
					)}
				</div>

				{selectedLanguage !== "JavaScript" && (
					<span className='text-[10px] text-yellow-600 bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-900/30 whitespace-nowrap'>
						⚠ Run only for JS
					</span>
				)}
			</div>

			<div className='flex items-center m-2'>
				<button
					className='preferenceBtn group'
					onClick={() => setSettings({ ...settings, settingsModalIsOpen: true })}
				>
					<div className='h-4 w-4 text-dark-gray-6 font-bold text-lg'>
						<AiOutlineSetting />
					</div>
					<div className='preferenceBtn-tooltip'>Settings</div>
				</button>

				<button className='preferenceBtn group' onClick={handleFullScreen}>
					<div className='h-4 w-4 text-dark-gray-6 font-bold text-lg'>
						{!isFullScreen ? <AiOutlineFullscreen /> : <AiOutlineFullscreenExit />}
					</div>
					<div className='preferenceBtn-tooltip'>Full Screen</div>
				</button>
			</div>
			{settings.settingsModalIsOpen && <SettingsModal settings={settings} setSettings={setSettings} />}
		</div>
	);
};
export default PreferenceNav;
