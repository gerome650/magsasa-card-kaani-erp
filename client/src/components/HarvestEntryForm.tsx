import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Save, X } from 'lucide-react';
import { farmersData } from '@/data/farmersData';
import { toast } from 'sonner';

interface HarvestEntryFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function HarvestEntryForm({ onClose, onSubmit }: HarvestEntryFormProps) {
  const [formData, setFormData] = useState({
    farmerId: '',
    farmerName: '',
    farmLocation: '',
    crop: '',
    harvestDate: new Date().toISOString().split('T')[0],
    quantity: '',
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: '',
    landAreaHarvested: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const crops = ['Rice', 'Corn', 'Vegetables', 'Fruits', 'Sugarcane', 'Coconut'];
  const units = ['kg', 'MT', 'bags', 'pieces'];
  const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Grade C'];

  const handleFarmerChange = (farmerId: string) => {
    const farmer = farmersData.find(f => f.id === farmerId);
    if (farmer) {
      setFormData({
        ...formData,
        farmerId,
        farmerName: farmer.name,
        farmLocation: farmer.location,
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.farmerId) newErrors.farmerId = 'Please select a farmer';
    if (!formData.crop) newErrors.crop = 'Please select a crop';
    if (!formData.harvestDate) newErrors.harvestDate = 'Please select harvest date';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
      newErrors.pricePerUnit = 'Please enter a valid price';
    }
    if (!formData.landAreaHarvested || parseFloat(formData.landAreaHarvested) <= 0) {
      newErrors.landAreaHarvested = 'Please enter a valid land area';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const pricePerUnit = parseFloat(formData.pricePerUnit);
    const landArea = parseFloat(formData.landAreaHarvested);
    const totalValue = quantity * pricePerUnit;
    const yieldPerHectare = quantity / landArea;

    const harvestRecord = {
      id: `H${Date.now()}`,
      ...formData,
      quantity,
      pricePerUnit,
      totalValue,
      landAreaHarvested: landArea,
      yieldPerHectare,
      farmId: `FARM${formData.farmerId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(harvestRecord);
    toast.success('Harvest record added successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Add Harvest Record</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter harvest details for tracking and analytics
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Farmer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Farmer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.farmerId}
                  onChange={(e) => handleFarmerChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.farmerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Farmer</option>
                  {farmersData.map(farmer => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name} - {farmer.id}
                    </option>
                  ))}
                </select>
                {errors.farmerId && (
                  <p className="text-xs text-red-500 mt-1">{errors.farmerId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Farm Location</label>
                <Input
                  value={formData.farmLocation}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Crop and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Crop <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.crop}
                  onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.crop ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Crop</option>
                  {crops.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
                {errors.crop && (
                  <p className="text-xs text-red-500 mt-1">{errors.crop}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Harvest Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    className={errors.harvestDate ? 'border-red-500' : ''}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.harvestDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.harvestDate}</p>
                )}
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quality Grade and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quality Grade</label>
                <select
                  value={formData.qualityGrade}
                  onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {qualityGrades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price per Unit (₱) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  className={errors.pricePerUnit ? 'border-red-500' : ''}
                />
                {errors.pricePerUnit && (
                  <p className="text-xs text-red-500 mt-1">{errors.pricePerUnit}</p>
                )}
              </div>
            </div>

            {/* Land Area */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Land Area Harvested (hectares) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter land area in hectares"
                value={formData.landAreaHarvested}
                onChange={(e) => setFormData({ ...formData, landAreaHarvested: e.target.value })}
                className={errors.landAreaHarvested ? 'border-red-500' : ''}
              />
              {errors.landAreaHarvested && (
                <p className="text-xs text-red-500 mt-1">{errors.landAreaHarvested}</p>
              )}
            </div>

            {/* Estimated Value Display */}
            {formData.quantity && formData.pricePerUnit && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Estimated Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₱{(parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                {formData.landAreaHarvested && (
                  <p className="text-sm text-gray-600 mt-2">
                    Yield: {(parseFloat(formData.quantity) / parseFloat(formData.landAreaHarvested)).toFixed(2)} {formData.unit}/ha
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                placeholder="Add any additional notes about this harvest..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Harvest Record
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
