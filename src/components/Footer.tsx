import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <img
                src="/wishwall.svg"
                alt="Wish Wall Logo"
                className="w-6 h-6 object-contain dark:invert"
              />
              <span className="text-sm font-medium">Wish Wall</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Create and share wish walls for any occasion.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Made with ❤️ for memorable moments by <a href="https://piyushhbhutoria.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Piyushh</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
