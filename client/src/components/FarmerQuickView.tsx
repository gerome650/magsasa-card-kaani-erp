import { X, MapPin, Phone, Mail, Calendar, TrendingUp, Award } from 'lucide-react';
import { useState } from 'react';
import type { Farmer } from '../data/farmersData';
import { harvestData } from '../data/harvestData';
import { ImageLightbox } from './ImageLightbox';

interface FarmerQuickViewProps {
  farmer: Farmer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FarmerQuickView({ farmer, isOpen, onClose }: FarmerQuickViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'harvest' | 'analytics'>('overview');
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen || !farmer) return null;

  // Get farmer's harvest records
  const farmerHarvests = harvestData.filter((h: any) => h.farmerId === farmer.id);
  
  // Calculate metrics
  const totalHarvest = farmerHarvests.reduce((sum: number, h: any) => sum + h.quantity, 0);
  const totalValue = farmerHarvests.reduce((sum: number, h: any) => sum + h.totalValue, 0);
  const avgYield = farmerHarvests.length > 0
    ? farmerHarvests.reduce((sum: number, h: any) => sum + h.yieldPerHectare, 0) / farmerHarvests.length
    : 0;

  // Calculate harvest by crop
  const harvestByCrop = farmerHarvests.reduce((acc: Record<string, number>, h: any) => {
    acc[h.crop] = (acc[h.crop] || 0) + h.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Calculate quality distribution
  const qualityDist = farmerHarvests.reduce((acc: Record<string, number>, h: any) => {
    acc[h.qualityGrade] = (acc[h.qualityGrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find farmer ranking
  const allFarmers = harvestData.reduce((acc: Record<string, number>, h: any) => {
    if (!acc[h.farmerId]) {
      acc[h.farmerId] = 0;
    }
    acc[h.farmerId] += h.quantity;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedFarmers = Object.entries(allFarmers)
    .sort(([, a], [, b]) => (b as number) - (a as number));
  const farmerRank = sortedFarmers.findIndex(([id]) => id === farmer.id) + 1;

  const getBadge = () => {
    if (farmerRank <= 3) return { text: 'Top 3 Performer', color: 'bg-yellow-500' };
    if (farmerRank <= 5) return { text: 'Top 5 Performer', color: 'bg-blue-500' };
    if (farmerRank <= 10) return { text: 'Top 10 Performer', color: 'bg-green-500' };
    return null;
  };

  const badge = getBadge();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-background border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border p-6 bg-accent/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                  {farmer.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Farmer Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{farmer.name}</h2>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                      {farmer.status}
                    </span>
                    {badge && (
                      <span className={`px-2 py-1 ${badge.color} text-white text-xs font-medium rounded flex items-center gap-1`}>
                        <Award className="w-3 h-3" />
                        {badge.text}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{farmer.id}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {farmer.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-1 p-2">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'harvest', label: 'Harvest History' },
                { id: 'analytics', label: 'Analytics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{farmer.contactNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{farmer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Member Since</p>
                        <p className="font-medium">{farmer.cardMemberSince}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ranking</p>
                        <p className="font-medium">#{farmerRank} of {sortedFarmers.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Farm Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Farm Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Land Area</p>
                      <p className="text-2xl font-bold mt-1">{farmer.totalLandArea} ha</p>
                    </div>
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Farms</p>
                      <p className="text-2xl font-bold mt-1">{farmer.activeFarms}</p>
                    </div>
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Harvest</p>
                      <p className="text-2xl font-bold mt-1">{totalHarvest.toFixed(1)} MT</p>
                    </div>
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold mt-1">₱{(totalValue / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>

                {/* Crops */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Crops Grown</h3>
                  <div className="flex flex-wrap gap-2">
                    {farmer.crops.map((crop) => (
                      <span
                        key={crop}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Best Performing Crop */}
                {Object.keys(harvestByCrop).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Best Performing Crop</h3>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-lg font-semibold text-primary">
                        {Object.entries(harvestByCrop).sort(([, a], [, b]) => (b as number) - (a as number))[0][0]}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(Object.entries(harvestByCrop).sort(([, a], [, b]) => (b as number) - (a as number))[0][1] as number).toFixed(1)} MT harvested
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'harvest' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Harvests ({farmerHarvests.length} records)</h3>
                {farmerHarvests.length > 0 ? (
                  <div className="space-y-3">
                    {farmerHarvests.slice(0, 10).map((harvest: any) => (
                      <div key={harvest.id} className="p-4 bg-accent/50 rounded-lg border border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{harvest.crop}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(harvest.harvestDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            harvest.qualityGrade === 'Premium'
                              ? 'bg-yellow-500/10 text-yellow-700'
                              : harvest.qualityGrade === 'Grade A'
                              ? 'bg-green-500/10 text-green-700'
                              : 'bg-blue-500/10 text-blue-700'
                          }`}>
                            {harvest.qualityGrade}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{harvest.quantity} {harvest.unit}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Value</p>
                            <p className="font-medium">₱{harvest.totalValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Yield</p>
                            <p className="font-medium">{harvest.yieldPerHectare.toFixed(0)} kg/ha</p>
                          </div>
                        </div>
                        {harvest.photos && harvest.photos.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">📷 {harvest.photos.length} photo{harvest.photos.length > 1 ? 's' : ''}</p>
                            <div className="flex gap-2">
                              {harvest.photos.map((photo: string, index: number) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Harvest photo ${index + 1}`}
                                  className="h-20 w-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    setLightboxImages(harvest.photos);
                                    setLightboxIndex(index);
                                    setIsLightboxOpen(true);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No harvest records found</p>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Harvests</p>
                    <p className="text-2xl font-bold mt-1">{farmerHarvests.length}</p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Harvest</p>
                    <p className="text-2xl font-bold mt-1">{totalHarvest.toFixed(1)} MT</p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold mt-1">₱{(totalValue / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Yield</p>
                    <p className="text-2xl font-bold mt-1">{avgYield.toFixed(0)} kg/ha</p>
                  </div>
                </div>

                {/* Harvest by Crop */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Harvest by Crop</h3>
                  <div className="space-y-3">
                    {Object.entries(harvestByCrop).map(([crop, quantity]) => {
                      const qty = quantity as number;
                      const percentage = (qty / totalHarvest) * 100;
                      return (
                        <div key={crop}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{crop}</span>
                            <span className="text-sm text-muted-foreground">
                              {qty.toFixed(1)} MT ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-accent rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quality Distribution */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quality Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(qualityDist).map(([grade, count]) => {
                      const cnt = count as number;
                      const percentage = (cnt / farmerHarvests.length) * 100;
                      return (
                        <div key={grade}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{grade}</span>
                            <span className="text-sm text-muted-foreground">
                              {cnt} harvests ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-accent rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 bg-accent/50 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Close
            </button>
            <a
              href={`/farmer/${farmer.id}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              View Full Profile
            </a>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
