import React from "react";
import { BsSun, BsMoon } from "react-icons/bs";
import { useTheme } from "@/pages/_app";

const ThemeToggle: React.FC = () => {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			className='flex items-center justify-center rounded-lg bg-dark-fill-3 hover:bg-dark-fill-2 h-8 w-8 cursor-pointer transition-all duration-300'
			title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
		>
			{theme === "dark" ? (
				<BsSun className='text-yellow-400' />
			) : (
				<BsMoon className='text-gray-400' />
			)}
		</button>
	);
};

export default ThemeToggle;

