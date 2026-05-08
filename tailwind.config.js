/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: [
		"./app/**/*.{js,ts,jsx,tsx}",
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				"dark-layer-1": "var(--bg-layer-1)",
				"dark-layer-2": "var(--bg-layer-2)",
				"dark-label-2": "var(--text-tertiary)",
				"dark-divider-border-2": "var(--border-primary)",
				"dark-fill-2": "var(--bg-fill-2)",
				"dark-fill-3": "var(--bg-fill-3)",
				"dark-gray-6": "var(--text-secondary)",
				"dark-gray-7": "var(--text-tertiary)",
				"gray-8": "var(--bg-primary)",
				"dark-gray-8": "var(--text-primary)",
				"brand-orange": "var(--brand-orange)",
				"brand-orange-s": "var(--brand-orange-s)",
				"dark-yellow": "rgb(255 192 30)",
				"dark-pink": "rgb(255 55 95)",
				olive: "rgb(0, 184, 163)",
				"dark-green-s": "rgb(44 187 93)",
				"dark-blue-s": "rgb(10 132 255)",
			},
		},
	},
	plugins: [],
};
