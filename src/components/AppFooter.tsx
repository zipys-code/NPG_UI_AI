export default function AppFooter() {
  return (
    <footer className="bg-footer text-footer-foreground border-t border-border px-6 py-3 flex items-center justify-between">
      <div className="text-xs">
        Current Release: mnn_ver24 (dev-domain)
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-foreground">Yael</span>
        <span className="text-footer-foreground">Software</span>
        <span className="text-muted-foreground text-[10px]">Part of Yael Group</span>
      </div>
    </footer>
  );
}
