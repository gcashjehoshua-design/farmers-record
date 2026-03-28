export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-earth-50 to-farm-50 border-t-2 border-earth-200 py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-earth-700 space-y-3 md:space-y-0">
          <p>© 2026 Department of Agriculture, City of Passi. All rights reserved.</p>
          <p>
            <span className="text-farm-600 font-semibold">Version 1.0</span> • Farmers Records & Transactions System
          </p>
        </div>
      </div>
    </footer>
  );
}
