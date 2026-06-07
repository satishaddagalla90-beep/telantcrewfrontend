import React from 'react';

interface PwaUpdateSnackbarProps {
  visible: boolean;
  onRefresh: () => void;
}

const PwaUpdateSnackbar: React.FC<PwaUpdateSnackbarProps> = ({ visible, onRefresh }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 mx-auto w-full max-w-md -translate-x-1/2 rounded-2xl border border-slate-300 bg-slate-950 px-4 py-3 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">Update available</p>
          <p className="text-sm text-slate-300">A new version is ready. Refresh to apply it.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default PwaUpdateSnackbar;
