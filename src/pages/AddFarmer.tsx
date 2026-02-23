import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Sprout } from "lucide-react";
import FarmerForm from "@/components/FarmerForm";

export default function AddFarmer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-farm-50/80">
        <div className="container mx-auto px-4 max-w-4xl py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-farm-100 rounded-2xl">
              <UserPlus className="w-10 h-10 text-farm-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-gray-900">
                Add New Farmer
              </h1>
              <p className="text-base md:text-lg text-gray-700">
                Register a new farmer in the system with their agricultural details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <Card className="card-modern border-farm-200 animate-slide-up">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-farm-100">
              <div className="p-3 bg-farm-100 rounded-xl">
                <Sprout className="w-6 h-6 text-farm-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Farmer Registration</h2>
                <p className="text-sm text-gray-600">Fill in all the required information below</p>
              </div>
            </div>
            <FarmerForm
              onSuccess={() => {
                navigate("/farmers");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
