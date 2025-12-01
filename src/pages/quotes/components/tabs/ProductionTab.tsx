import React, { useState } from 'react';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { useQuote, type ProductionActivity } from '../../context/QuoteContext';
import NumberInput from '../../../../components/common/NumberInput';
import Label from '../../../../components/common/Label';
import Button from '../../../../components/common/Button';
import Checkbox from '../../../../components/common/Checkbox';
import { formatPrice } from '../../../../utils/formatting';

interface ActivityFormData {
  name: string;
  workTimeHours: number;
  workTimeMinutes: number;
  price: number;
  costPerHour: number;
  marginPercent: number;
  ignoreMinQuantity: boolean;
}

const ProductionTab: React.FC = () => {
  const { state, dispatch } = useQuote();
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState<ActivityFormData>({
    name: '',
    workTimeHours: 0,
    workTimeMinutes: 0,
    price: 0,
    costPerHour: 0,
    marginPercent: 0,
    ignoreMinQuantity: false,
  });

  const handleUpdateActivity = (activityId: string, field: keyof ProductionActivity, value: number | boolean | string) => {
    dispatch({
      type: 'UPDATE_PRODUCTION_ACTIVITY',
      activityId,
      updates: { [field]: value },
    });
  };

  const handleAddActivity = () => {
    dispatch({
      type: 'ADD_PRODUCTION_ACTIVITY',
      activity: {
        name: newActivity.name,
        workTimeHours: newActivity.workTimeHours,
        workTimeMinutes: newActivity.workTimeMinutes,
        price: newActivity.price,
        costPerHour: newActivity.costPerHour,
        marginPercent: newActivity.marginPercent,
        ignoreMinQuantity: newActivity.ignoreMinQuantity,
      },
    });

    setNewActivity({
      name: '',
      workTimeHours: 0,
      workTimeMinutes: 0,
      price: 0,
      costPerHour: 0,
      marginPercent: 0,
      ignoreMinQuantity: false,
    });
    setShowNewActivityForm(false);
  };

  const handleRemoveActivity = (activityId: string) => {
    dispatch({
      type: 'REMOVE_PRODUCTION_ACTIVITY',
      activityId,
    });
  };

  const handleMarginPlnChange = (activityId: string, marginPln: number) => {
    const activity = state.productionActivities.find(a => a.id === activityId);
    if (!activity) return;

    const marginPercent = activity.price > 0 ? (marginPln / activity.price) * 100 : 0;
    dispatch({
      type: 'UPDATE_PRODUCTION_ACTIVITY',
      activityId,
      updates: { marginPln, marginPercent },
    });
  };

  const handleCostPerHourChange = (activityId: string, costPerHour: number) => {
    dispatch({
      type: 'UPDATE_PRODUCTION_ACTIVITY_COST_PER_HOUR',
      activityId,
      costPerHour,
    });
  };

  const renderActivityForm = (
    activity: ProductionActivity | null,
    formData: ActivityFormData | ProductionActivity,
    isNew: boolean = false
  ) => {
    const updateField = isNew
      ? (field: keyof ActivityFormData, value: any) => {
          setNewActivity(prev => ({ ...prev, [field]: value }));
        }
      : (field: keyof ProductionActivity, value: any) => {
          if (activity) {
            handleUpdateActivity(activity.id, field, value);
          }
        };

    const marginPln = isNew
      ? (formData.price * (formData as ActivityFormData).marginPercent) / 100
      : (formData as ProductionActivity).marginPln;

    return (
      <div className="space-y-6 p-4 border border-gray-600 rounded-lg bg-section-grey-dark">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <Label htmlFor={`activity-name-${activity?.id || 'new'}`}>Nazwa</Label>
            <input
              id={`activity-name-${activity?.id || 'new'}`}
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="input-style w-full"
              placeholder="Nazwa czynności"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`ignore-min-qty-${activity?.id || 'new'}`}
              checked={formData.ignoreMinQuantity}
              onChange={(e) => updateField('ignoreMinQuantity', e.target.checked)}
            />
            <Label htmlFor={`ignore-min-qty-${activity?.id || 'new'}`} className="text-sm">
              Ignoruj ilość minimalną
            </Label>
            {!isNew && state.productionActivities.length > 1 && (
              <Button
                size="sm"
                color="failure"
                onClick={() => handleRemoveActivity(activity!.id)}
              >
                <HiTrash className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Czas pracy (h):(mm)</Label>
            <div className="flex gap-2 items-center">
              <NumberInput
                value={formData.workTimeHours}
                onChange={(value) => updateField('workTimeHours', value)}
                placeholder="Godziny"
                min={0}
              />
              <span className="text-white">:</span>
              <NumberInput
                value={formData.workTimeMinutes}
                onChange={(value) => updateField('workTimeMinutes', Math.max(0, Math.min(59, value)))}
                placeholder="Minuty"
                min={0}
                max={59}
              />
            </div>
          </div>

          <div>
            <Label>Koszt</Label>
            <NumberInput
              value={formData.price}
              onChange={(value) => {
                if (isNew) {
                  const totalHours = formData.workTimeHours + formData.workTimeMinutes / 60;
                  const newCostPerHour = totalHours > 0 ? value / totalHours : 0;
                  setNewActivity(prev => ({ ...prev, price: value, costPerHour: newCostPerHour }));
                } else {
                  updateField('price', value);
                }
              }}
              min={0}
              step={0.01}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label>Koszt/h</Label>
            <NumberInput
              value={isNew ? (formData as ActivityFormData).costPerHour : (formData as ProductionActivity).costPerHour || 0}
              onChange={(value) => {
                if (isNew) {
                  const totalHours = formData.workTimeHours + formData.workTimeMinutes / 60;
                  const newPrice = totalHours > 0 ? value * totalHours : 0;
                  setNewActivity(prev => ({ ...prev, costPerHour: value, price: newPrice }));
                } else {
                  handleCostPerHourChange(activity!.id, value);
                }
              }}
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <Label>Marża %</Label>
            <NumberInput
              value={(formData as any).marginPercent}
              onChange={(value) => updateField('marginPercent', value)}
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <Label>Marża PLN</Label>
            <NumberInput
              value={marginPln}
              onChange={(value) => {
                if (isNew) {
                  const marginPercent = formData.price > 0 ? (value / formData.price) * 100 : 0;
                  setNewActivity(prev => ({ ...prev, marginPercent }));
                } else {
                  handleMarginPlnChange(activity!.id, value);
                }
              }}
              min={0}
              step={0.01}
            />
          </div>
        </div>

        {!isNew && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-300">Koszt/h: </span>
                <span className="text-white font-medium">{formatPrice((formData as ProductionActivity).costPerHour + (formData as ProductionActivity).marginPln / ((formData.workTimeHours + formData.workTimeMinutes / 60) || 1))} PLN</span>
              </div>
              <div>
                <span className="text-gray-300">Suma: </span>
                <span className="text-white font-medium">{formatPrice((formData as ProductionActivity).total)} PLN</span>
              </div>
            </div>
          </div>
        )}

        {isNew && (
          <div className="flex gap-4">
            <Button color="primary" onClick={handleAddActivity}>
              Dodaj
            </Button>
            <Button color="gray" onClick={() => setShowNewActivityForm(false)}>
              Anuluj
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {state.productionActivities.map((activity) => 
        renderActivityForm(activity, activity, false)
      )}

      {showNewActivityForm && renderActivityForm(null, newActivity, true)}

      {!showNewActivityForm && (
        <div className="text-center">
          <Button
            color="primary"
            onClick={() => setShowNewActivityForm(true)}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            <HiPlus className="w-4 h-4 mr-2" />
            Dodaj etap
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductionTab;