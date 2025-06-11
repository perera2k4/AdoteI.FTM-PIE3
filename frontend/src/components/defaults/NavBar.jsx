export default function Navbar() {
  return (
    <nav className="w-full bg-slate-100 shadow-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="../../../public/logo.png"
            alt="Logo"
            className="h-14 w-auto sm:h-16"
          />
        </div>
      </div>
    </nav>
  );
}