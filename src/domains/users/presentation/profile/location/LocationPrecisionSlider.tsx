'use client'

import {
  formatLocationPrivacyLabel,
  LOCATION_REFERENCE_RADIUS_METERS,
  LOCATION_SLIDER_MAX,
  locationPrivacyFromSliderValue,
  referenceLabelSliderPercent,
  sliderValueFromLocationPrivacy,
  type LocationPrivacy,
} from '@/domains/users/domain/user-location'
import { Label } from '@/shared/ui/label'

export function LocationPrecisionSlider({
  value,
  disabled,
  onChange,
}: {
  value: LocationPrivacy
  disabled?: boolean
  onChange: (privacy: LocationPrivacy) => void
}) {
  const sliderValue = sliderValueFromLocationPrivacy(value)

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-2'>
        <Label htmlFor='location-precision'>Precisión</Label>
        <span className='text-sm font-medium text-foreground'>{formatLocationPrivacyLabel(value)}</span>
      </div>

      <input
        id='location-precision'
        type='range'
        min={0}
        max={LOCATION_SLIDER_MAX}
        step={1}
        value={sliderValue}
        disabled={disabled}
        className='w-full accent-primary'
        onChange={(event) => onChange(locationPrivacyFromSliderValue(Number(event.target.value)))}
      />

      <div className='relative h-5 text-[10px] text-muted-foreground sm:text-xs'>
        <span className='absolute left-0 top-0'>Exacta</span>
        {LOCATION_REFERENCE_RADIUS_METERS.map((meters) => (
          <span
            key={meters}
            className='absolute top-0 -translate-x-1/2 whitespace-nowrap'
            style={{ left: `${referenceLabelSliderPercent(meters)}%` }}
          >
            {meters >= 1000 ? '1 km' : `${meters}m`}
          </span>
        ))}
        <span className='absolute right-0 top-0'>Ciudad</span>
      </div>
      <p className='text-xs text-muted-foreground'>
        Los valores en metros son de referencia; podés elegir cualquier nivel intermedio.
      </p>
    </div>
  )
}
