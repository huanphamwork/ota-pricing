import React, { useState, useMemo } from 'react';
import { 
  Building2, Globe2, Briefcase, TicketPercent, Calculator, 
  AlertCircle, Receipt, Plus, Trash2, ArrowDown, TrendingUp, Percent
} from 'lucide-react';

const OTA_PLATFORMS = [
  { id: 'booking', name: 'Booking.com', comm: 15, hasFct: true, logo: '🟦' },
  { id: 'agoda', name: 'Agoda', comm: 15, hasFct: true, logo: '🟥' },
  { id: 'traveloka', name: 'Traveloka', comm: 15, hasFct: false, logo: '🐦' },
  { id: 'direct', name: 'Bán Trực Tiếp', comm: 0, hasFct: false, logo: '💬' },
];

export default function App() {
  const [netResort, setNetResort] = useState(1000000);
  const [selectedPlatform, setSelectedPlatform] = useState(OTA_PLATFORMS[0].id);
  const [customComm, setCustomComm] = useState(OTA_PLATFORMS[0].comm);
  const [customFct, setCustomFct] = useState(OTA_PLATFORMS[0].hasFct ? 10 : 0);
  const [opsFeePct, setOpsFeePct] = useState(3);
  
  // Mảng chứa các lớp khuyến mại (Promotion Layers)
  const [promos, setPromos] = useState([
    { id: 1, name: 'Khuyến mại mặc định (Basic Deal)', type: 'percent', value: 20 },
  ]);

  const addPromo = () => {
    setPromos([...promos, { id: Date.now(), name: `Khuyến mại mới`, type: 'percent', value: 10 }]);
  };

  const updatePromo = (id, field, newValue) => {
    setPromos(promos.map(p => p.id === id ? { ...p, [field]: newValue } : p));
  };

  const removePromo = (id) => {
    setPromos(promos.filter(p => p.id !== id));
  };

  const handlePlatformChange = (e) => {
    const platformId = e.target.value;
    setSelectedPlatform(platformId);
    const platform = OTA_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      setCustomComm(platform.comm);
      setCustomFct(platform.hasFct ? 10 : 0);
    }
  };

  // --- CORE MATH (CHIẾN LƯỢC QUỸ DỰ PHÒNG + STACKING) ---
  const calculationData = useMemo(() => {
    const commRate = customComm / 100;
    const fctRate = customFct / 100; 
    const fctTotalRate = commRate * fctRate; // FCT là % của hoa hồng
    const opsRate = opsFeePct / 100;

    // 1. Gộp tổng các loại KM
    const totalPromoPct = promos.filter(p => p.type === 'percent').reduce((sum, p) => sum + (Number(p.value) || 0) / 100, 0);
    const totalPromoFixed = promos.filter(p => p.type === 'fixed').reduce((sum, p) => sum + (Number(p.value) || 0), 0);

    const totalDeductionRate = commRate + fctTotalRate + opsRate + totalPromoPct;

    if (totalDeductionRate >= 1) return { error: "Tổng phí và khuyến mại (%) vượt quá 100%. Vui lòng giảm bớt!" };

    // 2. Tính Giá Bán Gốc (Gross Price) theo công thức gộp (Giống hệt Excel của bạn)
    const listPrice = Math.round((netResort + totalPromoFixed) / (1 - totalDeductionRate));

    // 3. Mô phỏng hành trình khách áp mã (từ trên xuống)
    let currentPrice = listPrice;
    const promoBreakdown = promos.map(promo => {
      const val = Number(promo.value) || 0;
      let discountAmount = 0;
      if (promo.type === 'percent') {
        discountAmount = Math.round(listPrice * (val / 100)); // KM % tính trên giá gốc
      } else {
        discountAmount = val; // KM tiền mặt
      }
      
      const priceBefore = currentPrice;
      currentPrice -= discountAmount;
      return { ...promo, priceBefore, discountAmount, priceAfter: currentPrice };
    });

    const paidPrice = currentPrice;

    // 4. Tính phí THỰC TẾ dựa trên tiền khách quẹt thẻ
    const actualOta = Math.round(paidPrice * commRate);
    const actualFct = Math.round(actualOta * fctRate); // Tính chính xác dựa trên fctRate tuỳ chỉnh
    const actualOps = Math.round(paidPrice * opsRate);
    
    const actualNet = paidPrice - actualOta - actualFct - actualOps;
    const surplus = actualNet - netResort; // Tiền lời thêm sinh ra do bớt phí

    return {
      error: null,
      listPrice,
      paidPrice,
      promoBreakdown,
      surplus,
      fees: {
        ota: actualOta,
        fct: actualFct,
        ops: actualOps,
        totalNet: actualNet
      }
    };
  }, [netResort, customComm, customFct, opsFeePct, promos]);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Calculator size={28} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ma Trận Giá Stacking + Quỹ Dự Phòng</h1>
            <p className="text-slate-500 text-sm mt-1">Chồng chéo nhiều lớp khuyến mại. Giữ nguyên chiến lược sinh thặng dư lợi nhuận.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT NHẬP LIỆU BÊN TRÁI */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Nhóm 1 & 2 gộp gọn */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">1. Net Thu Về</label>
                <input 
                  type="number" value={netResort} onChange={(e) => setNetResort(Number(e.target.value))}
                  className="w-full font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">2. Nền tảng OTA</label>
                <select 
                  value={selectedPlatform} onChange={handlePlatformChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none mb-3"
                >
                  {OTA_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.logo} {p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Hoa hồng OTA</label>
                    <div className="relative">
                      <input 
                        type="number" value={customComm} onChange={(e) => setCustomComm(Number(e.target.value))}
                        className="w-full p-2 pr-7 text-sm font-semibold text-orange-600 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Thuế FCT</label>
                    <div className="relative">
                      <input 
                        type="number" value={customFct} onChange={(e) => setCustomFct(Number(e.target.value))}
                        className="w-full p-2 pr-7 text-sm font-semibold text-red-600 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-2 mt-2">
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">Phí Vận Hành / Thưởng KD</label>
                  <span className="text-sm font-bold text-blue-600">{opsFeePct}%</span>
                </div>
                <input 
                  type="range" min="0" max="20" step="1" value={opsFeePct} onChange={(e) => setOpsFeePct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Quản lý các lớp khuyến mại */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 p-1.5 rounded-lg"><TicketPercent size={18} /></span>
                  3. Xếp Lớp Khuyến Mại
                </h2>
                <button onClick={addPromo} className="flex items-center gap-1 text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-100 transition">
                  <Plus size={16} /> Thêm Lớp
                </button>
              </div>
              
              <div className="space-y-3">
                {promos.map((promo, index) => (
                  <div key={promo.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative group">
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-4 border-white">
                      {index + 1}
                    </div>
                    <div className="grid grid-cols-12 gap-3 pl-2">
                      <div className="col-span-12 md:col-span-5">
                        <input 
                          type="text" value={promo.name} onChange={(e) => updatePromo(promo.id, 'name', e.target.value)}
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg" placeholder="Tên khuyến mại"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-3">
                        <select 
                          value={promo.type} onChange={(e) => updatePromo(promo.id, 'type', e.target.value)}
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="percent">Giảm %</option>
                          <option value="fixed">Tiền VNĐ</option>
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <input 
                          type="number" value={promo.value} onChange={(e) => updatePromo(promo.id, 'value', e.target.value)}
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-purple-600"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                        <button onClick={() => removePromo(promo.id)} className="text-slate-400 hover:text-red-500 transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CỘT HIỂN THỊ KẾT QUẢ BÊN PHẢI */}
          <div className="lg:col-span-6">
            {calculationData.error ? (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-start gap-3"><AlertCircle /><p className="font-medium">{calculationData.error}</p></div>
            ) : (
              <div className="space-y-6 sticky top-6">
                
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden text-center">
                  <h3 className="text-slate-400 font-medium mb-1 text-sm uppercase tracking-wider">Giá Gạch Ngang Thiết Lập OTA</h3>
                  <div className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                    {formatVND(calculationData.listPrice)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
                  <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Hành trình gọt giá của OTA</h3>
                  
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-2 text-sm text-slate-500">
                      <span>Giá ban đầu:</span>
                      <span className="font-bold text-slate-800">{formatVND(calculationData.listPrice)}</span>
                    </div>
                    
                    {calculationData.promoBreakdown.map((promo, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex justify-center -my-1 relative z-10"><ArrowDown size={16} className="text-purple-300 bg-white" /></div>
                        <div className="bg-purple-50/50 p-3 rounded-lg flex justify-between items-center my-1 border border-purple-100/50">
                          <div>
                            <p className="text-sm font-medium text-purple-900">{promo.name}</p>
                            <p className="text-xs text-purple-600">
                              Áp dụng trừ {promo.type === 'percent' ? `${promo.value}%` : formatVND(promo.value)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-red-500">-{formatVND(promo.discountAmount)}</span>
                        </div>
                        <div className="flex justify-center -my-1 relative z-10"><ArrowDown size={16} className="text-purple-300 bg-white" /></div>
                        <div className="flex justify-between items-center py-2 text-sm text-slate-500">
                          <span>Giá còn lại:</span>
                          <span className="font-medium text-slate-700">{formatVND(promo.priceAfter)}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 bg-green-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                     <div className="flex justify-between items-center mb-4">
                       <span className="font-bold text-slate-700">KHÁCH THỰC TRẢ (QUẸT THẺ):</span>
                       <span className="text-xl font-black text-green-700">{formatVND(calculationData.paidPrice)}</span>
                     </div>
                     <div className="space-y-2 text-sm text-slate-600">
                       <div className="flex justify-between"><span>Trích Hoa hồng OTA:</span><span>-{formatVND(calculationData.fees.ota)}</span></div>
                       {calculationData.fees.fct > 0 && <div className="flex justify-between"><span>Trích Thuế FCT:</span><span>-{formatVND(calculationData.fees.fct)}</span></div>}
                       <div className="flex justify-between"><span>Trích Phí Vận Hành / Thưởng:</span><span>-{formatVND(calculationData.fees.ops)}</span></div>
                     </div>
                     <div className="mt-4 pt-3 border-t border-green-200 flex justify-between items-end">
                       <div>
                          <span className="font-bold text-green-900 uppercase block mb-1">Net Bỏ Túi Thực Tế:</span>
                          {calculationData.surplus > 0 && (
                            <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                               <TrendingUp size={12}/> Thặng dư: +{formatVND(calculationData.surplus)}
                            </span>
                          )}
                       </div>
                       <span className="text-2xl font-black text-green-700">{formatVND(calculationData.fees.totalNet)}</span>
                     </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}