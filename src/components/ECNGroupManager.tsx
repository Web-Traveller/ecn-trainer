import React, { useState, useEffect } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import type { ECNGroupConfig } from '../types';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiRotateCcw, FiKey, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

export const ECNGroupManager: React.FC = () => {
  const {
    routingConfig,
    addEcnGroup,
    updateEcnGroup,
    deleteEcnGroup,
    addEcnToGroup,
    removeEcnFromGroup,
    reorderEcnsInGroup,
    resetRoutingConfigToDefault
  } = useTrainerStore();

  const [recordingTarget, setRecordingTarget] = useState<{ groupId: string; type: 'buy' | 'sell' } | null>(null);
  const [newEcnInputs, setNewEcnInputs] = useState<Record<string, string>>({});
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');

  // Key recorder event listener
  useEffect(() => {
    if (!recordingTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const code = e.code;
      if (!code || code === 'Escape') {
        setRecordingTarget(null);
        return;
      }

      if (recordingTarget.type === 'buy') {
        updateEcnGroup(recordingTarget.groupId, { buyKey: code });
      } else {
        updateEcnGroup(recordingTarget.groupId, { sellKey: code });
      }
      setRecordingTarget(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [recordingTarget, updateEcnGroup]);

  const handleAddNewGroup = () => {
    const newId = `group_${Date.now().toString(36)}`;
    const groupCount = routingConfig.groups.length + 1;
    const newGroup: ECNGroupConfig = {
      id: newId,
      name: `Group ${groupCount}`,
      buyKey: `Key${String.fromCharCode(65 + ((groupCount - 1) % 26))}`,
      sellKey: `Key${String.fromCharCode(76 - ((groupCount - 1) % 10))}`,
      ecns: ['NEW_ECN']
    };
    addEcnGroup(newGroup);
  };

  const handleAddEcnSubmit = (groupId: string) => {
    const val = (newEcnInputs[groupId] || '').trim();
    if (val) {
      addEcnToGroup(groupId, val);
      setNewEcnInputs((prev) => ({ ...prev, [groupId]: '' }));
    }
  };

  const handleMoveEcn = (groupId: string, index: number, direction: 'up' | 'down') => {
    const group = routingConfig.groups.find((g) => g.id === groupId);
    if (!group) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= group.ecns.length) return;

    const updated = [...group.ecns];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    reorderEcnsInGroup(groupId, updated);
  };

  const startEditingName = (group: ECNGroupConfig) => {
    setEditingGroupId(group.id);
    setGroupNameInput(group.name);
  };

  const saveGroupName = (groupId: string) => {
    if (groupNameInput.trim()) {
      updateEcnGroup(groupId, { name: groupNameInput.trim() });
    }
    setEditingGroupId(null);
  };

  const formatKeyName = (code: string) => {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code === 'Semicolon') return ';';
    if (code === 'Quote') return "'";
    if (code === 'Comma') return ',';
    if (code === 'Period') return '.';
    return code;
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Key Recording Modal Overlay */}
      {recordingTarget && (
        <div className="fixed inset-0 z-50 bg-terminal-bg/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-terminal-panel border border-terminal-border p-6 max-w-md w-full text-center space-y-4 font-mono shadow-2xl">
            <div className="w-12 h-12 bg-info-blue/10 text-info-blue flex items-center justify-center mx-auto border border-info-blue/30 text-2xl">
              <FiKey />
            </div>
            <h3 className="text-sm font-bold text-terminal-text uppercase tracking-wider">
              [RECORD_HOTKEY] - {recordingTarget.type.toUpperCase()} SIDE
            </h3>
            <p className="text-xs text-terminal-muted">
              Press any physical key on your keyboard to capture binding. Press <kbd className="px-1.5 py-0.5 bg-terminal-bg border border-terminal-border text-terminal-text text-xs">Esc</kbd> to cancel.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 bg-terminal-bg border border-terminal-border text-info-blue text-xs font-bold animate-pulse">
                &gt; LISTENING_FOR_KEYSTROKE...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-terminal-border">
        <div>
          <h3 className="text-xs font-bold text-terminal-text uppercase tracking-wider flex items-center gap-2">
            <span>[ECN_HOTKEY_GROUPS]</span>
            <span className="text-[10px] px-2 py-0.5 bg-info-blue/10 text-info-blue border border-info-blue/30 font-bold">
              {routingConfig.groups.length} GROUPS
            </span>
          </h3>
          <p className="text-[11px] text-terminal-muted mt-0.5">
            Configure key groups, buy/sell hotkeys, custom ECN tickers, and press sequences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetRoutingConfigToDefault}
            className="flex items-center gap-1.5 px-3 py-1 bg-terminal-bg hover:bg-terminal-border text-terminal-muted hover:text-terminal-text text-xs border border-terminal-border transition-colors uppercase font-bold"
            title="Reset to default ECN groups"
          >
            <FiRotateCcw className="text-xs" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleAddNewGroup}
            className="flex items-center gap-1.5 px-3 py-1 bg-info-blue hover:bg-info-blue/90 text-terminal-bg font-bold text-xs transition-colors uppercase"
          >
            <FiPlus />
            <span>Add Group</span>
          </button>
        </div>
      </div>

      {/* Groups List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routingConfig.groups.map((group) => (
          <div
            key={group.id}
            className="bg-terminal-bg border border-terminal-border p-4 flex flex-col justify-between space-y-3"
          >
            <div>
              {/* Group Header */}
              <div className="flex items-center justify-between pb-2 border-b border-terminal-border/60 gap-2">
                {editingGroupId === group.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={groupNameInput}
                      onChange={(e) => setGroupNameInput(e.target.value)}
                      className="bg-terminal-panel border border-terminal-border px-2 py-1 text-xs text-terminal-text font-mono focus:outline-none focus:border-info-blue flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => saveGroupName(group.id)}
                      className="p-1 bg-success-green/20 text-success-green hover:bg-success-green/30 border border-success-green/30"
                    >
                      <FiCheck className="text-xs" />
                    </button>
                    <button
                      onClick={() => setEditingGroupId(null)}
                      className="p-1 bg-terminal-panel text-terminal-muted hover:text-terminal-text border border-terminal-border"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-terminal-text text-xs uppercase">{group.name}</h4>
                    <button
                      onClick={() => startEditingName(group)}
                      className="text-terminal-muted hover:text-terminal-text transition-colors"
                      title="Edit group name"
                    >
                      <FiEdit2 className="text-[10px]" />
                    </button>
                  </div>
                )}

                {routingConfig.groups.length > 1 && (
                  <button
                    onClick={() => deleteEcnGroup(group.id)}
                    className="p-1 text-terminal-muted hover:text-error-red transition-colors"
                    title="Delete group"
                  >
                    <FiTrash2 className="text-xs" />
                  </button>
                )}
              </div>

              {/* Hotkeys Section */}
              <div className="grid grid-cols-2 gap-2 my-3 font-mono">
                {/* BUY Hotkey */}
                <div className="bg-terminal-panel border border-terminal-border/80 p-2 space-y-1">
                  <span className="text-[9px] font-bold uppercase text-success-green block">BUY SIDE HOTKEY</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-terminal-text">
                      Shift + {formatKeyName(group.buyKey)}
                    </span>
                    <button
                      onClick={() => setRecordingTarget({ groupId: group.id, type: 'buy' })}
                      className="text-[10px] px-2 py-0.5 bg-info-blue/10 hover:bg-info-blue/20 text-info-blue border border-info-blue/30 uppercase font-bold"
                    >
                      Record
                    </button>
                  </div>
                </div>

                {/* SELL Hotkey */}
                <div className="bg-terminal-panel border border-terminal-border/80 p-2 space-y-1">
                  <span className="text-[9px] font-bold uppercase text-error-red block">SELL SIDE HOTKEY</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-terminal-text">
                      Shift + {formatKeyName(group.sellKey)}
                    </span>
                    <button
                      onClick={() => setRecordingTarget({ groupId: group.id, type: 'sell' })}
                      className="text-[10px] px-2 py-0.5 bg-warning-amber/10 hover:bg-warning-amber/20 text-warning-amber border border-warning-amber/30 uppercase font-bold"
                    >
                      Record
                    </button>
                  </div>
                </div>
              </div>

              {/* ECN Tickers List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-terminal-muted uppercase tracking-wider block">
                  TICKER SEQUENCE ({group.ecns.length})
                </span>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {group.ecns.map((ecn, idx) => (
                    <div
                      key={`${group.id}_${ecn}_${idx}`}
                      className="flex items-center justify-between bg-terminal-panel border border-terminal-border px-2.5 py-1 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-terminal-bg border border-terminal-border text-terminal-muted text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-terminal-text uppercase">{ecn}</span>
                        <span className="text-[10px] text-terminal-muted">
                          ({idx + 1} {idx === 0 ? 'press' : 'presses'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveEcn(group.id, idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-terminal-muted hover:text-terminal-text disabled:opacity-20"
                        >
                          <FiArrowUp className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleMoveEcn(group.id, idx, 'down')}
                          disabled={idx === group.ecns.length - 1}
                          className="p-0.5 text-terminal-muted hover:text-terminal-text disabled:opacity-20"
                        >
                          <FiArrowDown className="text-xs" />
                        </button>
                        <button
                          onClick={() => removeEcnFromGroup(group.id, ecn)}
                          className="p-0.5 text-terminal-muted hover:text-error-red ml-1"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Add ECN Inline */}
            <div className="pt-2 border-t border-terminal-border/60">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom ECN (e.g. BOSX2)..."
                  value={newEcnInputs[group.id] || ''}
                  onChange={(e) => setNewEcnInputs({ ...newEcnInputs, [group.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddEcnSubmit(group.id);
                    }
                  }}
                  className="bg-terminal-panel border border-terminal-border px-2.5 py-1 text-xs text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-info-blue flex-1 uppercase font-mono"
                />
                <button
                  onClick={() => handleAddEcnSubmit(group.id)}
                  className="px-2.5 py-1 bg-info-blue/10 hover:bg-info-blue/20 text-info-blue border border-info-blue/30 text-xs font-bold uppercase flex items-center gap-1 transition-colors"
                >
                  <FiPlus />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
