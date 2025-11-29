import React, { useState } from 'react';
import { useQuote } from '../../context/QuoteContext';
import type { Material } from '../../context/QuoteContext';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Label from '../../../../components/common/Label';
import Select from '../../../../components/common/Select';

const mockMaterials = [
  { name: 'Stal nierdzewna', price: 15.50 },
  { name: 'Aluminium', price: 12.30 },
  { name: 'Plastik ABS', price: 8.90 },
  { name: 'Miedź', price: 25.40 },
  { name: 'Drewno bukowe', price: 18.75 },
];

const MaterialsTab: React.FC = () => {
  const { state, dispatch } = useQuote();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const handleAddMaterial = () => {
    let materialName = '';
    let materialPrice = 0;

    if (selectedMaterial === 'custom') {
      materialName = customName;
      materialPrice = parseFloat(customPrice) || 0;
    } else {
      const material = mockMaterials.find(m => m.name === selectedMaterial);
      materialName = material?.name || '';
      materialPrice = material?.price || 0;
    }

    const finalPricePerUnit = pricePerUnit ? parseFloat(pricePerUnit) || 0 : materialPrice * (1 + (parseFloat(marginPercent) || 0) / 100);

    const newMaterial: Material = {
      id: Date.now().toString(),
      name: materialName,
      purchasePrice: materialPrice,
      marginPercent: pricePerUnit ? ((finalPricePerUnit - materialPrice) / materialPrice) * 100 : parseFloat(marginPercent) || 0,
      marginPln: finalPricePerUnit - materialPrice,
      pricePerUnit: finalPricePerUnit,
      totalPrice: finalPricePerUnit * (parseInt(quantity) || 1),
      quantity: parseInt(quantity) || 1,
    };

    dispatch({ type: 'ADD_MATERIAL', material: newMaterial });
    
    setShowAddForm(false);
    setSelectedMaterial('');
    setCustomName('');
    setCustomPrice('');
    setQuantity('');
    setMarginPercent('');
    setPricePerUnit('');
  };

  const handleUpdateMaterial = (materialId: string, field: string, value: number) => {
    dispatch({
      type: 'UPDATE_MATERIAL',
      materialId,
      updates: { [field]: value },
    });
  };

  const handleRemoveMaterial = (materialId: string) => {
    dispatch({ type: 'REMOVE_MATERIAL', materialId });
  };

  const handleMarginPercentChange = (value: string) => {
    setMarginPercent(value);
    
    const basePrice = selectedMaterial === 'custom' ? parseFloat(customPrice) || 0 : mockMaterials.find(m => m.name === selectedMaterial)?.price || 0;
    if (value && basePrice > 0) {
      const margin = parseFloat(value) || 0;
      const calculatedPricePerUnit = basePrice * (1 + margin / 100);
      setPricePerUnit(calculatedPricePerUnit.toFixed(2));
    } else {
      setPricePerUnit('');
    }
  };

  const handlePricePerUnitChange = (value: string) => {
    setPricePerUnit(value);
    
    const basePrice = selectedMaterial === 'custom' ? parseFloat(customPrice) || 0 : mockMaterials.find(m => m.name === selectedMaterial)?.price || 0;
    if (value && basePrice > 0) {
      const pricePerUnitValue = parseFloat(value) || 0;
      const calculatedMargin = ((pricePerUnitValue - basePrice) / basePrice) * 100;
      setMarginPercent(calculatedMargin.toFixed(2));
    } else {
      setMarginPercent('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-white">Lista surowców</h4>
        <Button onClick={() => setShowAddForm(true)} className="bg-[rgb(223,255,169)] hover:bg-[rgb(200,240,150)] text-black">
          Dodaj
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-background-dark p-4 rounded-lg border space-y-4">
          <h5 className="text-white font-medium">Dodaj nowy surowiec</h5>
          
          <div>
            <Label htmlFor="materialSelect">Wybierz surowiec</Label>
            <Select
              value={selectedMaterial}
              onChange={(e) => {
                setSelectedMaterial(e.target.value);
                // Recalculate when material changes
                if (e.target.value && e.target.value !== 'custom') {
                  const material = mockMaterials.find(m => m.name === e.target.value);
                  if (material && marginPercent) {
                    const margin = parseFloat(marginPercent) || 0;
                    const calculatedPricePerUnit = material.price * (1 + margin / 100);
                    setPricePerUnit(calculatedPricePerUnit.toFixed(2));
                  } else if (material && pricePerUnit) {
                    const pricePerUnitValue = parseFloat(pricePerUnit) || 0;
                    const calculatedMargin = ((pricePerUnitValue - material.price) / material.price) * 100;
                    setMarginPercent(calculatedMargin.toFixed(2));
                  }
                }
              }}
            >
              <option value="">Wybierz z listy</option>
              {mockMaterials.map((material) => (
                <option key={material.name} value={material.name}>
                  {material.name} - {material.price.toFixed(2)} PLN
                </option>
              ))}
              <option value="custom">Własny surowiec</option>
            </Select>
          </div>

          {selectedMaterial === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customName">Nazwa</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nazwa surowca"
                />
              </div>
              <div>
                <Label htmlFor="customPrice">Cena zakupu</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => {
                    setCustomPrice(e.target.value);
                    // Recalculate based on existing margin or price per unit
                    if (marginPercent && e.target.value) {
                      const basePrice = parseFloat(e.target.value) || 0;
                      const margin = parseFloat(marginPercent) || 0;
                      const calculatedPricePerUnit = basePrice * (1 + margin / 100);
                      setPricePerUnit(calculatedPricePerUnit.toFixed(2));
                    } else if (pricePerUnit && e.target.value) {
                      const basePrice = parseFloat(e.target.value) || 0;
                      const pricePerUnitValue = parseFloat(pricePerUnit) || 0;
                      if (basePrice > 0) {
                        const calculatedMargin = ((pricePerUnitValue - basePrice) / basePrice) * 100;
                        setMarginPercent(calculatedMargin.toFixed(2));
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Ilość</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setQuantity(isNaN(value) || value < 1 ? '' : value.toString());
                }}
              />
            </div>
            <div>
              <Label htmlFor="margin">Marża %</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={marginPercent}
                onChange={(e) => handleMarginPercentChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pricePerUnit">Cena za szt</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => handlePricePerUnitChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddMaterial}
              disabled={!selectedMaterial || (selectedMaterial === 'custom' && (!customName || !customPrice)) || !quantity || (!marginPercent && !pricePerUnit)}
              className="bg-[rgb(223,255,169)] hover:bg-[rgb(200,240,150)] text-black disabled:bg-gray-400 disabled:text-gray-600"
            >
              Dodaj
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              color="gray"
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}

      {state.materials.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background-dark rounded-lg">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-white">Nazwa</th>
                <th className="px-4 py-3 text-left text-white">Cena Zakupu</th>
                <th className="px-4 py-3 text-left text-white">Ilość</th>
                <th className="px-4 py-3 text-left text-white">Marża %</th>
                <th className="px-4 py-3 text-left text-white">Marża PLN</th>
                <th className="px-4 py-3 text-left text-white">Cena/Szt</th>
                <th className="px-4 py-3 text-left text-white">Cena suma</th>
                <th className="px-4 py-3 text-left text-white">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {state.materials.map((material) => (
                <tr key={material.id} className="border-b border-gray-700">
                  <td className="px-4 py-3 text-white">{material.name}</td>
                  <td className="px-4 py-3 text-white">{material.purchasePrice.toFixed(2)} PLN</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      value={material.quantity === 0 ? '' : material.quantity}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                        handleUpdateMaterial(material.id, 'quantity', isNaN(value) || value < 1 ? 1 : value);
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.marginPercent === 0 ? '' : material.marginPercent}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        handleUpdateMaterial(material.id, 'marginPercent', isNaN(value) ? 0 : Math.max(0, parseFloat(value.toFixed(2))));
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">{material.marginPln.toFixed(2)} PLN</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.pricePerUnit === 0 ? '' : material.pricePerUnit}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        handleUpdateMaterial(material.id, 'pricePerUnit', isNaN(value) ? 0 : Math.max(0, parseFloat(value.toFixed(2))));
                      }}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">{material.totalPrice.toFixed(2)} PLN</td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => handleRemoveMaterial(material.id)}
                      color="red"
                      size="sm"
                    >
                      Usuń
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.materials.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-400">
          Brak dodanych surowców. Kliknij "Dodaj" aby dodać pierwszy surowiec.
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;