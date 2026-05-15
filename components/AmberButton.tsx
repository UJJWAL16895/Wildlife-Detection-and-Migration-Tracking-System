import { ButtonHTMLAttributes } from 'react';

interface AmberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export default function AmberButton({ children, className = '', ...props }: AmberButtonProps) {
    return (
        <button 
            className={`
                relative overflow-hidden px-8 py-4 font-mono text-sm uppercase tracking-[0.2em] 
                text-[#0d1420] bg-[#d4a843] transition-all duration-300
                hover:bg-[#f0c056] hover:shadow-[0_0_30px_rgba(212,168,67,0.4)]
                active:scale-95 disabled:opacity-50 disabled:pointer-events-none
                ${className}
            `}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 hover:translate-y-0" />
        </button>
    );
}
