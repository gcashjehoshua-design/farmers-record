import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, Download, Settings as SettingsIcon, AlertCircle } from "lucide-react";

export default function Settings() {

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-earth-50/80">
        <div className="container mx-auto px-4 max-w-4xl py-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 bg-earth-100 rounded-2xl">
              <SettingsIcon className="w-10 h-10 text-earth-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-gray-900">
                Settings
              </h1>
              <p className="text-base md:text-lg text-gray-700">
                Manage system configuration and data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">

        {/* System Configuration */}
        <Card className="card-modern border-earth-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="bg-gradient-to-r from-earth-50 to-earth-100 border-b-2 border-earth-200">
            <CardTitle className="text-2xl font-display">System Configuration</CardTitle>
            <CardDescription className="text-base">Manage system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">Municipality Name</label>
              <Input
                placeholder="Passi City"
                defaultValue="Passi City"
                type="text"
                className="input-modern h-14 text-base"
              />
            </div>
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">Province</label>
              <Input
                placeholder="Iloilo"
                defaultValue="Iloilo"
                type="text"
                className="input-modern h-14 text-base"
              />
            </div>
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">Contact Email</label>
              <Input
                placeholder="contact@passi.gov.ph"
                type="email"
                className="input-modern h-14 text-base"
              />
            </div>
            <Button className="btn-farm w-full h-12 text-base">
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200">
            <CardTitle className="text-2xl font-display">Data Management</CardTitle>
            <CardDescription className="text-base">Export or backup your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button variant="outline" className="w-full justify-start h-12 border-2 border-farm-200 hover:bg-farm-50 hover:border-farm-400 font-semibold">
              <Download className="w-5 h-5 mr-2" />
              Export Farmers Data
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 border-2 border-farm-200 hover:bg-farm-50 hover:border-farm-400 font-semibold">
              <Download className="w-5 h-5 mr-2" />
              Export Transactions
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 border-2 border-farm-200 hover:bg-farm-50 hover:border-farm-400 font-semibold">
              <Download className="w-5 h-5 mr-2" />
              Backup Database
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="card-modern border-sky-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200">
            <CardTitle className="text-2xl font-display">About</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-base text-gray-700">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-sky-100 rounded-lg mt-1">
                  <AlertCircle className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Farmers Record System</p>
                  <p className="text-sm text-gray-600 mt-1">Version 1.0.0</p>
                </div>
              </div>
              <p className="leading-relaxed">A comprehensive system for managing farmer profiles and agricultural records with modern design and intuitive interface.</p>
              <p className="leading-relaxed">Built with React, TypeScript, Tailwind CSS, and modern web technologies for optimal performance and user experience.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
