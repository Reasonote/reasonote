const plugin = require('tailwindcss/plugin')

module.exports = {
    darkMode: ["class"],
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],    
    theme: {
    	extend: {
    		keyframes: {
    			fadeIn: {
    				'0%': {
    					opacity: '0'
    				},
    				'100%': {
    					opacity: '1'
    				}
    			},
				"border-beam": {
					"100%": {
						"offset-distance": "100%",
					},
				},
    		},
    		animation: {
    			fadeIn: 'fadeIn .5s ease-in-out',
				"border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
    		},
    		grayscale: {
    			'10': '10%',
    			'20': '20%',
    			'25': '25%',
    			'30': '30%',
    			'40': '40%',
    			'50': '50%',
    			'60': '60%',
    			'70': '70%',
    			'75': '75%',
    			'80': '80%',
    			'90': '90%'
    		},
    		listStyleType: {
    			revert: 'revert'
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
                // Add this new color for the sidebar
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar))',
                    foreground: 'hsl(var(--sidebar-foreground))'
                },
                'neutral-dark': {
                    800: '#1F1F1F',  // A dark gray without blue tint
                    700: '#2C2C2C',  // Slightly lighter shade for hover states
                    600: '#383838',  // Even lighter shade if needed
                },
    		}
    	}
    },
    plugins: [
      plugin(({ addVariant }) => {
        addVariant('ul', '& ul');
      }),
        require("tailwindcss-animate")
    ],
}