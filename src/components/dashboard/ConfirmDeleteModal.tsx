import { useAppStore } from '@/store/appStore';

export function ConfirmDeleteModal() {
  const { confirmDel, setConfirmDel, executeDel } = useAppStore();
  if (!confirmDel) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(5,7,13,0.85)] z-[200] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-up" onClick={e => e.target === e.currentTarget && setConfirmDel(null)}>
      <div className="bg-s1 border border-blue-2 rounded-2xl p-7 w-full max-w-[380px] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 gradient-bar" />
        <div className="font-display text-lg font-bold tracking-[.06em] text-destructive mb-5">🗑 Confirm Delete</div>
        <div className="text-[13px] text-t2 leading-relaxed mb-5">
          Are you sure you want to delete <strong className="text-foreground">{confirmDel.label}</strong>? This action cannot be undone.
        </div>
        <div className="flex gap-2.5">
          <button className="flex-1 py-2.5 rounded-lg border border-blue-2 bg-transparent text-t2 font-display font-bold text-sm tracking-[.06em] uppercase cursor-pointer hover:bg-s2 transition-all active:scale-[0.98]" onClick={() => setConfirmDel(null)}>Cancel</button>
          <button className="flex-1 py-2.5 rounded-lg bg-destructive text-primary-foreground border-none font-display font-bold text-sm tracking-[.06em] uppercase cursor-pointer shadow-[0_0_16px_rgba(232,64,64,0.3)] hover:-translate-y-px transition-all active:scale-[0.98]" onClick={executeDel}>DELETE</button>
        </div>
      </div>
    </div>
  );
}
