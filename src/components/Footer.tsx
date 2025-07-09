import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © 2024 Wallable. Create and share wish walls for any occasion.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Made with ❤️ for memorable moments by <a href="https://www.linkedin.com/in/piyushh-bhutoria/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Piyushh</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
