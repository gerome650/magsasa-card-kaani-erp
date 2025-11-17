import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SampleFormatsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-green-600 text-green-700 hover:bg-green-50"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Sample Formats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>KaAni Conversation Examples</DialogTitle>
          <DialogDescription>
            Sample conversation formats for different contexts and roles
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Farmer - Loan Matching */}
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">
                Farmer: Loan Matching
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700">User:</p>
                  <p className="text-gray-600">
                    "Gusto ko pong kumuha ng pautang para sa bagong tanim. Ano
                    pong mga requirements?"
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-700">KaAni:</p>
                  <p className="text-gray-600">
                    Magandang araw! Para sa agricultural loan sa CARD MRI,
                    kailangan po natin ng:
                    <br />
                    1. Valid ID at proof of farm ownership
                    <br />
                    2. Farm size at location details
                    <br />
                    3. Planting plan at crop type
                    <br />
                    4. AgScore™ assessment (automatic based on your farm data)
                    <br />
                    <br />
                    Ang inyong current AgScore ay 720 - qualified kayo para sa
                    up to ₱50,000 loan with 2% monthly interest.
                  </p>
                </div>
              </div>
            </div>

            {/* Farmer - Rice Farming Advice */}
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">
                Farmer: Rice Farming Advice
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700">User:</p>
                  <p className="text-gray-600">
                    "May nakikita akong brown spots sa dahon ng palay. Ano po
                    kaya ito?"
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-700">KaAni:</p>
                  <p className="text-gray-600">
                    Ang brown spots sa dahon ng palay ay maaaring tanda ng Rice
                    Blast disease (Magnaporthe oryzae). Mga rekomendasyon:
                    <br />
                    <br />
                    <strong>Immediate Actions:</strong>
                    <br />
                    • Apply fungicide (Tricyclazole 75% WP) - 40g per 16L water
                    <br />
                    • Improve field drainage
                    <br />
                    • Remove infected leaves
                    <br />
                    <br />
                    <strong>Prevention:</strong>
                    <br />
                    • Use resistant varieties (PSB Rc82, NSIC Rc222)
                    <br />
                    • Avoid excessive nitrogen fertilizer
                    <br />• Maintain proper plant spacing
                  </p>
                </div>
              </div>
            </div>

            {/* Technician - Risk Scoring */}
            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">
                Technician: Risk Assessment
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700">User:</p>
                  <p className="text-gray-600">
                    "Analyze the AgScore for Farmer ID F042. What factors are
                    affecting their score?"
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-700">KaAni:</p>
                  <p className="text-gray-600">
                    <strong>AgScore Analysis for F042: 680/1000</strong>
                    <br />
                    <br />
                    <strong>Score Breakdown:</strong>
                    <br />
                    • Farm Size (2.5 ha): +120 points
                    <br />
                    • Harvest History (3 seasons): +180 points
                    <br />
                    • Average Yield (4.2 MT/ha): +150 points
                    <br />
                    • Payment History: +130 points
                    <br />
                    • Soil Quality: +100 points
                    <br />
                    <br />
                    <strong>Risk Factors:</strong>
                    <br />
                    • Below-average yield last season (-50 points)
                    <br />
                    • No crop insurance (-30 points)
                    <br />
                    • Rainfed irrigation only (-20 points)
                    <br />
                    <br />
                    <strong>Recommendations to Improve Score:</strong>
                    <br />
                    1. Enroll in crop insurance program (+30 points)
                    <br />
                    2. Implement better fertilization schedule
                    <br />
                    3. Consider irrigation system upgrade
                  </p>
                </div>
              </div>
            </div>

            {/* Technician - Loan Matching */}
            <div className="border-l-4 border-orange-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">
                Technician: Loan Product Matching
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700">User:</p>
                  <p className="text-gray-600">
                    "Find suitable loan products for farmers with AgScore
                    650-700 and farm size 3-5 hectares."
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-700">KaAni:</p>
                  <p className="text-gray-600">
                    <strong>Recommended Loan Products:</strong>
                    <br />
                    <br />
                    <strong>1. Agricultural Production Loan</strong>
                    <br />
                    • Amount: ₱30,000 - ₱60,000
                    <br />
                    • Interest: 2.5% monthly
                    <br />
                    • Term: 4-6 months (1 cropping season)
                    <br />
                    • Requirements: AgScore ≥650, 2+ ha farm
                    <br />
                    <br />
                    <strong>2. Equipment Financing</strong>
                    <br />
                    • Amount: Up to ₱100,000
                    <br />
                    • Interest: 2.8% monthly
                    <br />
                    • Term: 12-24 months
                    <br />
                    • Requirements: AgScore ≥680, collateral required
                    <br />
                    <br />
                    <strong>3. Working Capital Loan</strong>
                    <br />
                    • Amount: ₱20,000 - ₱50,000
                    <br />
                    • Interest: 2.2% monthly
                    <br />
                    • Term: 3-6 months
                    <br />• Requirements: AgScore ≥650, active CARD member
                  </p>
                </div>
              </div>
            </div>

            {/* Dialect Example */}
            <div className="border-l-4 border-pink-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">
                Cebuano Dialect Example
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700">User:</p>
                  <p className="text-gray-600">
                    "Unsaon nako pag-apply sa loan para sa akong uma?"
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-700">KaAni:</p>
                  <p className="text-gray-600">
                    Maayong adlaw! Aron maka-apply ka sa agricultural loan,
                    kinahanglan nimo ang:
                    <br />
                    <br />
                    1. Valid ID ug proof sa imong yuta
                    <br />
                    2. Detalye sa imong uma (gidak-on, lokasyon)
                    <br />
                    3. Plano sa pagtanom
                    <br />
                    4. AgScore assessment (automatic base sa imong farm data)
                    <br />
                    <br />
                    Ang imong current AgScore kay 720 - qualified ka para sa up
                    to ₱50,000 loan with 2% monthly interest.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
