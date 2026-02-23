import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarmers, useCreateTransaction } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Edit, Receipt, RotateCcw, Check, Loader, Search as SearchIcon } from "lucide-react";
import type { Farmer } from "@/types";
import { ALL_TRANSACTION_TYPES } from "@/constants/transactionTypes";

export default function RecordTransaction() {
  const navigate = useNavigate();
  const { data: farmers, isLoading } = useFarmers();
  const createTransaction = useCreateTransaction();
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [transactionType, setTransactionType] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const filteredFarmers = farmers?.filter(
    (farmer) =>
      farmer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (farmer.phone && farmer.phone.includes(searchTerm))
  ) || [];

  const handleSelectFarmer = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setSearchTerm("");
    setCurrentStep(1);
  };

  const handleTransactionTypeSelect = (type: string) => {
    setTransactionType(type);
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer || !transactionType) {
      alert("Please complete all required fields");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        farmerId: selectedFarmer.id,
        transactionType,
        amount: amount ? parseFloat(amount) : undefined,
        description: description || undefined,
        notes: notes || undefined,
        date: new Date(),
      });
      alert("Transaction recorded successfully!");
      handleReset();
    } catch (error) {
      console.error("Error recording transaction:", error);
      alert("Failed to record transaction. Please try again.");
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSearchTerm("");
    setSelectedFarmer(null);
    setTransactionType("");
    setAmount("");
    setDescription("");
    setNotes("");
  };

  const filteredTransactionTypes = ALL_TRANSACTION_TYPES.filter((t) =>
    t.toLowerCase().includes(transactionTypeFilter.toLowerCase())
  );

  const steps = ["Select Farmer", "Transaction Type", "Details"];

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-harvest-50/80">
        <div className="container mx-auto px-4 max-w-4xl py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-harvest-100 rounded-2xl">
              <Receipt className="w-10 h-10 text-harvest-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-gray-900">
                Record Transaction
              </h1>
              <p className="text-base md:text-lg text-gray-700">
                Register a farmer visit and record their transaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">
        {/* Progress Stepper */}
        <Card className="card-modern border-harvest-200 animate-slide-up">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-300 ${
                      index <= currentStep 
                        ? "bg-gradient-harvest text-white shadow-lg scale-110" 
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {index < currentStep ? <Check className="w-6 h-6" /> : index + 1}
                    </div>
                    <p className={`text-sm font-semibold mt-3 ${
                      index <= currentStep ? "text-gray-900" : "text-gray-500"
                    }`}>
                      {step}
                    </p>
                  </div>
                  {index !== steps.length - 1 && (
                    <div className={`flex-1 h-2 mx-4 rounded-full transition-all duration-300 ${
                      index < currentStep ? "bg-gradient-harvest" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Select Farmer */}
          {currentStep >= 0 && (
            <Card className="card-modern border-sky-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-200 rounded-xl">
                    <User className="w-6 h-6 text-sky-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-display">Step 1: Select Farmer</CardTitle>
                    <CardDescription className="text-base">Search and select a farmer from the list</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <Input
                  placeholder="Search farmer by name or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!!selectedFarmer}
                  className="input-modern h-14 text-base"
                />

                {selectedFarmer ? (
                  <div className="p-6 bg-gradient-to-br from-farm-50 to-farm-100 border-2 border-farm-400 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-farm-700 font-bold text-lg">
                      <div className="p-2 bg-farm-200 rounded-lg">
                        <Check className="w-5 h-5" />
                      </div>
                      Selected Farmer
                    </div>
                    <div className="p-4 bg-white rounded-xl border-2 border-farm-200 shadow-sm">
                      <h3 className="font-bold text-xl mb-2 text-gray-900">
                        {selectedFarmer.fullName}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="text-lg">📱</span>
                        {selectedFarmer.phone}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedFarmer(null);
                        setSearchTerm("");
                        setCurrentStep(0);
                      }}
                      variant="outline"
                      className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold"
                    >
                      Change Farmer
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-auto border-2 border-gray-200 rounded-xl shadow-sm">
                    {isLoading ? (
                      <div className="p-12 text-center">
                        <Loader className="w-10 h-10 animate-spin mx-auto text-farm-600" />
                        <p className="text-gray-600 text-base mt-4 font-medium">Loading farmers...</p>
                      </div>
                    ) : filteredFarmers.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {filteredFarmers.map((farmer) => (
                          <button
                            key={farmer.id}
                            type="button"
                            onClick={() => handleSelectFarmer(farmer)}
                            className="w-full text-left p-4 hover:bg-farm-50 transition-all duration-200 group"
                          >
                            <p className="font-semibold text-gray-900 text-base group-hover:text-farm-700">
                              {farmer.fullName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{farmer.phone}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <p className="text-gray-600 text-base mb-4 font-medium">No farmers found</p>
                        <Button
                          variant="default"
                          onClick={() => navigate("/add-farmer")}
                          className="btn-farm"
                        >
                          Add New Farmer
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Select Transaction Type */}
          {currentStep >= 1 && selectedFarmer && (
            <Card className="card-modern border-harvest-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="bg-gradient-to-r from-harvest-50 to-harvest-100 border-b-2 border-harvest-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-harvest-200 rounded-xl">
                    <Edit className="w-6 h-6 text-harvest-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-display">Step 2: Transaction Type</CardTitle>
                    <CardDescription className="text-base">What is the purpose of this visit?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search transaction types..."
                        value={transactionTypeFilter}
                        onChange={(e) => setTransactionTypeFilter(e.target.value)}
                        className="input-modern pl-10 h-12"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-2 border-harvest-200 hover:bg-harvest-50"
                      onClick={() => setTransactionTypeFilter(transactionTypeFilter.trim())}
                    >
                      <SearchIcon className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Select Transaction Type</label>
                    <select
                      value={transactionType}
                      onChange={(e) => handleTransactionTypeSelect(e.target.value)}
                      className="input-modern w-full h-12"
                    >
                      <option value="">Choose a transaction type...</option>
                      {filteredTransactionTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Enter Transaction Details */}
          {currentStep >= 2 && selectedFarmer && transactionType && (
            <Card className="card-modern border-earth-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="bg-gradient-to-r from-earth-50 to-earth-100 border-b-2 border-earth-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-earth-200 rounded-xl">
                    <Receipt className="w-6 h-6 text-earth-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-display">Step 3: Transaction Details</CardTitle>
                    <CardDescription className="text-base">Fill in the transaction information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div>
                  <label className="text-base font-semibold text-gray-900 mb-3 block">Amount (if any money involved)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold text-lg">₱</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input-modern pl-10 h-14 text-base"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-base font-semibold text-gray-900 mb-3 block">Brief Description</label>
                  <Input
                    placeholder="Describe the transaction"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-modern h-14 text-base"
                  />
                </div>

                <div>
                  <label className="text-base font-semibold text-gray-900 mb-3 block">Additional Notes (Optional)</label>
                  <textarea
                    placeholder="Any additional notes about this transaction"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    className="input-modern resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {currentStep >= 2 && selectedFarmer && transactionType && (
            <Card className="card-modern border-gray-200 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Clear Form
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate("/farmers")}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-farm flex-1 h-12 text-base font-semibold"
                    disabled={createTransaction.isPending}
                  >
                    {createTransaction.isPending ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Save Transaction
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}

