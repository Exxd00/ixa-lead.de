import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
  			],
  			mono: [
  				'var(--font-mono)',
  				'ui-monospace',
  				'monospace'
  			]
  		},
  		colors: {
  			/* Graphit-Blauschwarz — für Überschriften, Fließtext-Dunkel und den
  			   dunklen Hero. Neutral-modern statt Braun/Terrakotta oder Sepia. */
  			navy: {
  				'50': '#EEF1F5',
  				'100': '#D9DEE6',
  				'200': '#B3BCC9',
  				'300': '#8993A6',
  				'400': '#5C6577',
  				'500': '#3D4658',
  				'600': '#2A3241',
  				'700': '#1D2430',
  				'800': '#141922',
  				'900': '#0D1117',
  				'950': '#0B0F14',
  				DEFAULT: '#1D2430'
  			},
  			/* Frisches Smaragdgrün — für Häkchen/"gemessen"-Zustände. */
  			success: {
  				'50': '#E8FBF3',
  				'100': '#C7F3E1',
  				'200': '#94E7C7',
  				'300': '#5CD6AA',
  				'400': '#2EC28E',
  				'500': '#16A87A',
  				'600': '#0F8863',
  				'700': '#0C6C4F',
  				'800': '#0A5540',
  				'900': '#084333',
  				DEFAULT: '#16A87A'
  			},
  			/* Ember-Koralle — zweiter Akzent neben dem Signal-Blau, für
  			   Highlights/Badges (Tailwind-Key intern "stamp" beibehalten). */
  			stamp: {
  				'50': '#FFF1EC',
  				'100': '#FFDCCE',
  				'200': '#FFB89D',
  				'300': '#FF936C',
  				'400': '#FF7043',
  				'500': '#E85D2C',
  				'600': '#C44A1F',
  				'700': '#9C3A18',
  				'800': '#7A2E13',
  				'900': '#5C230E',
  				DEFAULT: '#E85D2C'
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
  			soft: '0 1px 2px rgba(13,17,23,0.04), 0 8px 24px -8px rgba(13,17,23,0.10)',
  			card: '0 2px 8px rgba(13,17,23,0.06), 0 16px 40px -12px rgba(13,17,23,0.14)',
  			cta: '0 8px 24px -6px rgba(91,124,255,0.45), 0 2px 6px rgba(13,17,23,0.15)',
  			'cta-pressed': '0 3px 10px -4px rgba(91,124,255,0.5), 0 1px 3px rgba(13,17,23,0.15)',
  			glow: '0 0 0 1px rgba(91,124,255,0.15), 0 0 40px -8px rgba(91,124,255,0.35)'
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
  			},
  			'signal-ping': {
  				'0%': { transform: 'scale(1)', opacity: '0.8' },
  				'70%, 100%': { transform: 'scale(2.4)', opacity: '0' }
  			},
  			'draw-line': {
  				from: { strokeDashoffset: 'var(--line-length, 600)' },
  				to: { strokeDashoffset: '0' }
  			},
  			'drift': {
  				'0%, 100%': { transform: 'translate(0, 0)' },
  				'50%': { transform: 'translate(3%, -4%)' }
  			}
  		},
  		animation: {
  			'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
  			'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
  			'flow-down': 'flow-down 2.6s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'signal-ping': 'signal-ping 2.2s cubic-bezier(0,0,0.2,1) infinite',
  			'draw-line': 'draw-line 1.8s cubic-bezier(0.22,1,0.36,1) forwards',
  			'drift': 'drift 14s ease-in-out infinite'
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
  plugins: [tailwindcssAnimate],
} satisfies Config;
