import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

interface PinLockScreenProps {
  requiredPin: string;
  onUnlocked: () => void;
}

export function PinLockScreen({ requiredPin, onUnlocked }: PinLockScreenProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    const char = value.slice(-1); // Take last character entered
    newDigits[index] = char;
    setDigits(newDigits);
    setError(false);
    setErrorMessage('');

    // Advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if completely filled
    const currentCode = newDigits.join('');
    if (currentCode.length === 6) {
      verifyPin(currentCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      verifyPin(digits.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      verifyPin(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === requiredPin) {
      setError(false);
      onUnlocked();
    } else {
      setError(true);
      setErrorMessage('Incorrect Security PIN. Please try again.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 600);
    }
  };

  const handleNumberPadClick = (num: number) => {
    const nextEmptyIndex = digits.findIndex((d) => d === '');
    if (nextEmptyIndex !== -1) {
      handleChange(nextEmptyIndex, num.toString());
    }
  };

  const handleBackspacePad = () => {
    const lastFilledIndex = digits.map((d, i) => (d !== '' ? i : -1)).filter((i) => i !== -1).pop();
    if (lastFilledIndex !== undefined) {
      const newDigits = [...digits];
      newDigits[lastFilledIndex] = '';
      setDigits(newDigits);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  return (
    <div
      id="pin-lock-container"
      className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div
        id="pin-lock-card"
        className={`relative z-10 w-full max-w-md bg-slate-900/90 border ${
          error ? 'border-red-500/50 shadow-red-500/10' : 'border-slate-800 shadow-2xl'
        } backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-slate-100 transition-all duration-200 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header Icon & Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5 flex items-center gap-2">
            <span>Security Verification</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xs">
            Enter the 6-digit access PIN to unlock the GitHub Gemini Code Studio.
          </p>
        </div>

        {/* PIN Inputs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              id={`pin-input-${idx}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border bg-slate-950/70 text-white outline-none transition-all ${
                digit
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              } ${error ? 'border-red-500 text-red-400 bg-red-950/20' : ''}`}
            />
          ))}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-6 flex items-center justify-center gap-2 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/40 py-2.5 px-3 rounded-lg animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Onscreen Keypad for Mobile / Click */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberPadClick(num)}
              className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 active:bg-indigo-600 border border-slate-700/60 hover:border-slate-600 text-base font-semibold text-slate-200 transition-colors flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-slate-600" />
          </div>
          <button
            type="button"
            onClick={() => handleNumberPadClick(0)}
            className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 active:bg-indigo-600 border border-slate-700/60 hover:border-slate-600 text-base font-semibold text-slate-200 transition-colors flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspacePad}
            className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 active:bg-red-600 border border-slate-700/60 hover:border-slate-600 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center"
          >
            Delete
          </button>
        </div>

        {/* Submit Action */}
        <button
          id="btn-verify-pin"
          type="button"
          onClick={() => verifyPin(digits.join(''))}
          disabled={digits.join('').length < 6}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Lock className="w-4 h-4" />
          <span>Unlock Application</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Protected with PIN authorization (840140)
          </p>
        </div>
      </div>
    </div>
  );
}
