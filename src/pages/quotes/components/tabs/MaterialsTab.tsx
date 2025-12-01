import React, { useState } from 'react';
import { useQuote } from '../../context/QuoteContext';
import type { Material } from '../../context/QuoteContext';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Label from '../../../../components/common/Label';
import ProductSelect from '../../../../components/common/ProductSelect';
import { useProducts } from '../../../../hooks/useBiService';
import type { ProductDto } from '../../../../api/bi-service';
import { formatDecimal } from '../../../../utils/formatting';

const MaterialsTab: React.FC = () => {
  const { state, dispatch } = useQuote();
  const { isLoading: productsLoading } = useProducts();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const handleAddMaterial = () => {
    const requestedQuantity = parseInt(quantity) || 1;
    let materialName: string;
    let materialPrice: number;
    let maxQuantity: number;

    if (selectedProduct) {
      materialName = selectedProduct.name;
      materialPrice = selectedProduct.price;
      maxQuantity = selectedProduct.quantity;
      
      if (requestedQuantity > maxQuantity) {
        alert(`Maximum available quantity is ${maxQuantity}`);
        return;
      }
    } else {
      materialName = customProductName || selectedProductCode || 'Custom Product';
      materialPrice = parseFloat(pricePerUnit) || 0;
    }

    const finalPricePerUnit = parseFloat(pricePerUnit) || 0;
    const marginPercentValue = parseFloat(marginPercent) || 0;
    const calculatedMarginPln = materialPrice > 0 && marginPercentValue > 0 
      ? (materialPrice * marginPercentValue) / 100 
      : finalPricePerUnit - materialPrice;

    const newMaterial: Material = {
      id: Date.now().toString(),
      name: materialName,
      purchasePrice: materialPrice,
      marginPercent: materialPrice > 0 ? ((finalPricePerUnit - materialPrice) / materialPrice) * 100 : marginPercentValue,
      marginPln: calculatedMarginPln,
      pricePerUnit: finalPricePerUnit,
      totalPrice: finalPricePerUnit * requestedQuantity,
      quantity: requestedQuantity,
    };

    dispatch({ type: 'ADD_MATERIAL', material: newMaterial });
    
    setShowAddForm(false);
    setSelectedProduct(null);
    setSelectedProductCode('');
    setCustomProductName('');
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
    
    if (selectedProduct) {
      const basePrice = selectedProduct.price;
      if (value && basePrice > 0) {
        const margin = parseFloat(value) || 0;
        const calculatedPricePerUnit = basePrice * (1 + margin / 100);
        setPricePerUnit(formatDecimal(calculatedPricePerUnit));
      }
    }
  };

  const handlePricePerUnitChange = (value: string) => {
    setPricePerUnit(value);
    
    if (selectedProduct) {
      const basePrice = selectedProduct.price;
      if (value && basePrice > 0) {
        const pricePerUnitValue = parseFloat(value) || 0;
        const calculatedMargin = ((pricePerUnitValue - basePrice) / basePrice) * 100;
        setMarginPercent(formatDecimal(calculatedMargin));
      }
    }
  };

  const handleProductSelect = (product: ProductDto | null) => {
    setSelectedProduct(product);
    
    if (product) {
      setPricePerUnit(product.price.toString());
    } else {
      setPricePerUnit('');
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
            <Label htmlFor="productSelect">Wybierz produkt</Label>
            <ProductSelect
              value={customProductName}
              onCodeChange={setSelectedProductCode}
              onNameChange={setCustomProductName}
              onProductSelect={handleProductSelect}
              searchBy="name"
              showPrice={true}
              loading={productsLoading}
            />
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">
                Ilość
                {selectedProduct && (
                  <span className="text-gray-400 text-xs"> (max: {selectedProduct.quantity})</span>
                )}
              </Label>
              <Input
                type="number"
                max={selectedProduct ? selectedProduct.quantity : undefined}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="margin">Marża %</Label>
              <Input
                type="number"
                step="0.01"
                value={marginPercent}
                onChange={(e) => handleMarginPercentChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pricePerUnit">
                Cena za {selectedProduct ? selectedProduct.unitOfMeasure : 'szt'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => handlePricePerUnitChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddMaterial}
              className="bg-[rgb(223,255,169)] hover:bg-[rgb(200,240,150)] text-black"
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
                      value={material.quantity}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseInt(e.target.value) || '';
                        handleUpdateMaterial(material.id, 'quantity', value === '' ? 0 : value);
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={formatDecimal(material.marginPercent)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                        handleUpdateMaterial(material.id, 'marginPercent', value === '' ? 0 : value);
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">{material.marginPln.toFixed(2)} PLN</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={formatDecimal(material.pricePerUnit)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                        handleUpdateMaterial(material.id, 'pricePerUnit', value === '' ? 0 : value);
                      }}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">{material.totalPrice.toFixed(2)} PLN</td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => handleRemoveMaterial(material.id)}
                      color="failure"
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

      {state.materials.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-lg font-medium text-white mb-4">Koszt Surowców</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-300">Marża: </span>
              <span className="text-white font-medium">{state.materials.reduce((sum, m) => sum + (m.marginPln * m.quantity), 0).toFixed(2)} PLN</span>
            </div>
            <div>
              <span className="text-gray-300">Suma: </span>
              <span className="text-white font-medium">{state.materials.reduce((sum, m) => sum + m.totalPrice, 0).toFixed(2)} PLN</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;