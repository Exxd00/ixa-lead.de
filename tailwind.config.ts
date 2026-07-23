import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-display)',
  				'var(--font-sans)',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		colors: {
  			navy: {
  				'50': '#EEF3FA',
  				'100': '#D6E2F1',
  				'200': '#AEC5E3',
  				'300': '#7C9FCE',
  				'400': '#4E76AF',
  				'500': '#2C5188',
  				'600': '#193C6B',
  				'700': '#0F2E56',
  				'800': '#0B2447',
  				'900': '#081A36',
  				'950': '#050F22',
  				DEFAULT: '#0B2447'
  			},
  			success: {
  				'50': '#ECFDF3',
  				'100': '#D1FADF',
  				'200': '#A6F4C5',
  				'300': '#6CE9A6',
  				'400': '#32D583',
  				'500': '#16A34A',
  				'600': '#0F8A3D',
  				'700': '#0C6E32',
  				'800': '#0A562A',
  				'900': '#084023',
  				DEFAULT: '#16A34A'
  			},
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 1px 2px rgba(11,36,71,0.04), 0 10px 30px -12px rgba(11,36,71,0.12)',
  			card: '0 1px 3px rgba(11,36,71,0.05), 0 18px 40px -20px rgba(11,36,71,0.20)',
  			cta: '0 8px 22px -8px rgba(37,99,235,0.55)'
  		},
  		keyframes: {
  			'fade-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(16px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'pulse-soft': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.5'
  				}
  			},
  			'flow-down': {
  				'0%': {
  					transform: 'translateY(-120%)',
  					opacity: '0'
  				},
  				'30%': {
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateY(220%)',
  					opacity: '0'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
  			'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
  			'flow-down': 'flow-down 2.6s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		container: {
  			center: true,
  			padding: {
  				DEFAULT: '1rem',
  				sm: '2rem',
  				lg: '4rem',
  				xl: '5rem',
  				'2xl': '6rem'
  			},
  			screens: {
  				sm: '640px',
  				md: '768px',
  				lg: '1024px',
  				xl: '1280px',
  				'2xl': '1536px'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
