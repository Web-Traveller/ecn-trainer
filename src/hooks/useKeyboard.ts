import { useEffect } from 'react';
import { useTrainerStore } from '../store/trainerStore';

export function useKeyboard() {
  const sessionState = useTrainerStore((state) => state.sessionState);
  const currentPrompt = useTrainerStore((state) => state.currentPrompt);
  const feedback = useTrainerStore((state) => state.feedback);
  const submissionMethod = useTrainerStore((state) => state.submissionMethod);
  const cancelMethod = useTrainerStore((state) => state.cancelMethod);
  const keyBindings = useTrainerStore((state) => state.keyBindings);

  const pressRouteKey = useTrainerStore((state) => state.pressRouteKey);
  const adjustPrice = useTrainerStore((state) => state.adjustPrice);
  const submitAnswer = useTrainerStore((state) => state.submitAnswer);
  const resetPromptInput = useTrainerStore((state) => state.resetPromptInput);
  const clearPromptInput = useTrainerStore((state) => state.clearPromptInput);
  const setDebugInfo = useTrainerStore((state) => state.setDebugInfo);

  useEffect(() => {
    if (sessionState !== 'RUNNING' || !currentPrompt) return;

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

      const action = currentPrompt.action;
      const validCodes = action === 'BUY' 
        ? [
            keyBindings.buyGroupA,
            keyBindings.buyGroupS,
            keyBindings.buyGroupD,
            keyBindings.buyGroupZ,
            keyBindings.buyGroupX
          ]
        : [
            keyBindings.sellGroupA,
            keyBindings.sellGroupS,
            keyBindings.sellGroupD,
            keyBindings.sellGroupZ,
            keyBindings.sellGroupX
          ];

      if (validCodes.includes(e.code)) {
        e.preventDefault();
        pressRouteKey(e.code);
      }
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
    pressRouteKey,
    adjustPrice,
    submitAnswer,
    resetPromptInput,
    clearPromptInput,
    setDebugInfo
  ]);
}
export default useKeyboard;
