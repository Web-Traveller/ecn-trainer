import { useEffect } from 'react';
import { useTrainerStore } from '../store/trainerStore';

export function useKeyboard() {
  const sessionState = useTrainerStore((state) => state.sessionState);
  const currentPrompt = useTrainerStore((state) => state.currentPrompt);
  const feedback = useTrainerStore((state) => state.feedback);
  const submissionMethod = useTrainerStore((state) => state.submissionMethod);
  const cancelMethod = useTrainerStore((state) => state.cancelMethod);
  const keyBindings = useTrainerStore((state) => state.keyBindings);
  const countdownRemaining = useTrainerStore((state) => state.countdownRemaining);

  const pressRouteKey = useTrainerStore((state) => state.pressRouteKey);
  const adjustPrice = useTrainerStore((state) => state.adjustPrice);
  const submitAnswer = useTrainerStore((state) => state.submitAnswer);
  const resetPromptInput = useTrainerStore((state) => state.resetPromptInput);
  const clearPromptInput = useTrainerStore((state) => state.clearPromptInput);
  const setDebugInfo = useTrainerStore((state) => state.setDebugInfo);

  useEffect(() => {
    if (sessionState !== 'RUNNING' || !currentPrompt || countdownRemaining !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keep track of the latest key pressed for debug purposes
      setDebugInfo(e.code, e.key, e.shiftKey);

      // Block key presses if in the feedback overlay state
      if (feedback) return;

      // 1. Submit checks
      const isEnter = e.key === 'Enter';
      const isMatchSubmit = 
        (submissionMethod === 'Enter' && isEnter) ||
        (submissionMethod === 'ShiftEnter' && isEnter && e.shiftKey);
      
      if (isMatchSubmit) {
        e.preventDefault();
        submitAnswer();
        return;
      }

      // 2. Clear / Cancel checks
      const isEscape = e.key === 'Escape';
      const isMatchCancel = 
        (cancelMethod === 'Escape' && isEscape) ||
        (cancelMethod === 'ShiftEscape' && isEscape && e.shiftKey);
      
      if (isMatchCancel) {
        e.preventDefault();
        clearPromptInput();
        return;
      }

      // 3. Reset (Space) checks
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        resetPromptInput();
        return;
      }

      // 4. Price scale arrow indicators
      if (currentPrompt.priceAdjustment !== undefined) {
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          adjustPrice(e.shiftKey ? -5 : -1);
          return;
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          adjustPrice(e.shiftKey ? 5 : 1);
          return;
        }
      }

      // 5. Route key checks (requires Shift modifier)
      if (!e.shiftKey) return;

      const ignoredCodes = [
        'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 
        'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 
        'CapsLock', 'Tab', 'Backspace', 'Enter', 'Escape', 'Space',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'NumLock', 'ScrollLock'
      ];

      if (ignoredCodes.includes(e.code)) return;

      e.preventDefault();
      pressRouteKey(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    sessionState,
    currentPrompt,
    feedback,
    submissionMethod,
    cancelMethod,
    keyBindings,
    countdownRemaining,
    pressRouteKey,
    adjustPrice,
    submitAnswer,
    resetPromptInput,
    clearPromptInput,
    setDebugInfo
  ]);
}
export default useKeyboard;
